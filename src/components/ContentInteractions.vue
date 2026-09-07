<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";
import {
  createComment,
  deleteComment,
  fetchCommentReplies,
  fetchComments,
  fetchInteractions,
  recordView,
  updateInteraction,
} from "@/services/social";

const props = defineProps({
  type: { type: String, required: true },
  contentId: { type: String, required: true },
});

const userStore = useUserStore();
const state = reactive({
  likes: 0,
  favorites: 0,
  comments: 0,
  views: 0,
  liked: false,
  favorited: false,
});
const comments = ref([]);
const commentsCursor = ref("");
const commentText = ref("");
const replyText = ref("");
const replyingTo = ref(null);
const message = ref("");
const busyAction = ref("");
const loadingComments = ref(false);
const loadingMoreComments = ref(false);

function applyState(value) {
  if (value) Object.assign(state, value);
}

function prepareRootComment(comment) {
  return {
    ...comment,
    replies: Array.isArray(comment.replies) ? comment.replies : [],
    replyCount: Number(comment.replyCount || 0),
    repliesNextCursor: comment.repliesNextCursor || "",
    repliesExpanded: false,
    repliesLoading: false,
  };
}

async function load() {
  if (!props.contentId) return;
  message.value = "";
  loadingComments.value = true;
  comments.value = [];
  commentsCursor.value = "";
  replyingTo.value = null;
  try {
    const [interactionState, commentPage] = await Promise.all([
      fetchInteractions(props.type, props.contentId),
      fetchComments(props.type, props.contentId),
    ]);
    applyState(interactionState);
    comments.value = commentPage.comments.map(prepareRootComment);
    commentsCursor.value = commentPage.nextCursor;
  } catch (error) {
    message.value = error.message || "互动信息加载失败";
  } finally {
    loadingComments.value = false;
  }

  try {
    const key = `life-view:${props.type}:${props.contentId}`;
    if (!sessionStorage.getItem(key)) {
      const viewed = await recordView(props.type, props.contentId);
      state.views = viewed.views;
      sessionStorage.setItem(key, "1");
    }
  } catch {
    // 浏览统计失败不影响评论区。
  }
}

async function loadMoreComments() {
  if (!commentsCursor.value || loadingMoreComments.value) return;
  loadingMoreComments.value = true;
  try {
    const page = await fetchComments(props.type, props.contentId, {
      cursor: commentsCursor.value,
    });
    const known = new Set(comments.value.map((comment) => comment.id));
    comments.value.push(
      ...page.comments
        .filter((comment) => !known.has(comment.id))
        .map(prepareRootComment),
    );
    commentsCursor.value = page.nextCursor;
  } catch (error) {
    message.value = error.message || "更多评论加载失败";
  } finally {
    loadingMoreComments.value = false;
  }
}

async function toggle(action) {
  if (!userStore.isLoggedIn) {
    message.value = "请先登录后再进行互动";
    return;
  }
  const property = action === "LIKE" ? "liked" : "favorited";
  busyAction.value = action;
  message.value = "";
  try {
    applyState(await updateInteraction(props.type, props.contentId, action, !state[property]));
  } catch (error) {
    message.value = error.message || "操作失败";
  } finally {
    busyAction.value = "";
  }
}

async function submitComment() {
  if (!userStore.isLoggedIn) {
    message.value = "请先登录后再发表评论";
    return;
  }
  const content = commentText.value.trim();
  if (!content || busyAction.value) return;
  busyAction.value = "COMMENT";
  message.value = "";
  try {
    const comment = await createComment(props.type, props.contentId, content);
    comments.value.unshift(prepareRootComment(comment));
    state.comments += 1;
    commentText.value = "";
    message.value = "评论已发布";
  } catch (error) {
    message.value = error.message || "评论发布失败";
  } finally {
    busyAction.value = "";
  }
}

function beginReply(root, target = root) {
  if (!userStore.isLoggedIn) {
    message.value = "请先登录后再回复评论";
    return;
  }
  replyingTo.value = {
    rootId: root.id,
    parentId: target.id,
    name: target.creator?.name || "该用户",
  };
  replyText.value = "";
}

function cancelReply() {
  replyingTo.value = null;
  replyText.value = "";
}

async function submitReply(root) {
  const content = replyText.value.trim();
  if (!content || busyAction.value !== "") return;
  busyAction.value = `REPLY:${root.id}`;
  message.value = "";
  try {
    const reply = await createComment(
      props.type,
      props.contentId,
      content,
      replyingTo.value?.parentId || root.id,
    );
    if (!root.replies.some((item) => item.id === reply.id)) root.replies.push(reply);
    root.replyCount += 1;
    root.repliesExpanded = true;
    state.comments += 1;
    cancelReply();
  } catch (error) {
    message.value = error.message || "回复发布失败";
  } finally {
    busyAction.value = "";
  }
}

async function expandReplies(root) {
  if (root.repliesExpanded) {
    root.repliesExpanded = false;
    if (replyingTo.value?.rootId === root.id) cancelReply();
    return;
  }

  root.repliesExpanded = true;
  if (root.replyCount <= root.replies.length && !root.repliesNextCursor) return;
  root.repliesLoading = true;
  try {
    const page = await fetchCommentReplies(props.type, props.contentId, root.id);
    root.replies = page.comments;
    root.repliesNextCursor = page.nextCursor;
  } catch (error) {
    root.repliesExpanded = false;
    message.value = error.message || "回复加载失败";
  } finally {
    root.repliesLoading = false;
  }
}

async function loadMoreReplies(root) {
  if (!root.repliesNextCursor || root.repliesLoading) return;
  root.repliesLoading = true;
  try {
    const page = await fetchCommentReplies(props.type, props.contentId, root.id, {
      cursor: root.repliesNextCursor,
    });
    const known = new Set(root.replies.map((reply) => reply.id));
    root.replies.push(...page.comments.filter((reply) => !known.has(reply.id)));
    root.repliesNextCursor = page.nextCursor;
  } catch (error) {
    message.value = error.message || "更多回复加载失败";
  } finally {
    root.repliesLoading = false;
  }
}

async function removeComment(comment, root = null) {
  if (!comment.canDelete || !window.confirm(root ? "确定删除这条回复吗？" : "确定删除这条评论及其全部回复吗？")) {
    return;
  }
  try {
    const result = await deleteComment(comment.id);
    const deletedCount = Math.max(1, Number(result.deletedCount || 1));
    if (root) {
      root.replies = root.replies.filter((item) => item.id !== comment.id);
      root.replyCount = Math.max(0, root.replyCount - 1);
      if (replyingTo.value?.parentId === comment.id) cancelReply();
    } else {
      comments.value = comments.value.filter((item) => item.id !== comment.id);
      if (replyingTo.value?.rootId === comment.id) cancelReply();
    }
    state.comments = Math.max(0, state.comments - deletedCount);
  } catch (error) {
    message.value = error.message || "评论删除失败";
  }
}

function visibleReplies(root) {
  return root.repliesExpanded ? root.replies : root.replies.slice(0, 3);
}

watch(() => [props.type, props.contentId], load);
onMounted(async () => {
  await userStore.initialize();
  await load();
});
</script>

<template>
  <section class="content-interactions" aria-label="作品互动">
    <header class="discussion-heading">
      <div>
        <span>DISCUSSION</span>
        <h3>评论 <small>{{ state.comments }}</small></h3>
      </div>
      <div class="interaction-summary">
        <button
          :class="{ active: state.liked }"
          :disabled="busyAction === 'LIKE'"
          type="button"
          @click="toggle('LIKE')"
        >
          <span aria-hidden="true">♡</span>
          {{ state.liked ? "已点赞" : "点赞" }}
          <strong>{{ state.likes }}</strong>
        </button>
        <button
          :class="{ active: state.favorited }"
          :disabled="busyAction === 'FAVORITE'"
          type="button"
          @click="toggle('FAVORITE')"
        >
          <span aria-hidden="true">☆</span>
          {{ state.favorited ? "已收藏" : "收藏" }}
          <strong>{{ state.favorites }}</strong>
        </button>
        <span>浏览 {{ state.views }}</span>
      </div>
    </header>

    <form class="comment-composer" @submit.prevent="submitComment">
      <div class="composer-avatar" aria-hidden="true">
        <img
          v-if="userStore.user?.avatarUrl"
          :src="userStore.user.avatarUrl"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span v-else>{{ userStore.user?.name?.slice(0, 1) || "评" }}</span>
      </div>
      <div class="composer-body">
        <textarea
          v-model="commentText"
          maxlength="500"
          rows="3"
          :placeholder="userStore.isLoggedIn ? '友善交流，分享你的看法' : '登录后参与讨论'"
        ></textarea>
        <div>
          <small>{{ commentText.length }}/500</small>
          <button :disabled="busyAction === 'COMMENT' || !commentText.trim()">
            {{ busyAction === "COMMENT" ? "发布中…" : "发表评论" }}
          </button>
        </div>
      </div>
    </form>

    <p v-if="message" class="interaction-message" role="status">{{ message }}</p>

    <div class="comment-list" :aria-busy="loadingComments">
      <article v-for="root in comments" :key="root.id" class="root-comment">
        <RouterLink :to="`/users/${root.creator.uid}`" class="root-avatar">
          <img
            v-if="root.creator.avatarUrl"
            :src="root.creator.avatarUrl"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <span v-else>{{ root.creator.name?.slice(0, 1) || "用" }}</span>
        </RouterLink>

        <div class="root-body">
          <header class="comment-author">
            <RouterLink :to="`/users/${root.creator.uid}`">{{ root.creator.name }}</RouterLink>
            <span>Lv.{{ root.creator.level }}</span>
          </header>
          <p class="comment-content">{{ root.content }}</p>
          <footer class="comment-actions">
            <time :datetime="root.createdAt">{{ formatDateTime(root.createdAt) }}</time>
            <button type="button" @click="beginReply(root)">回复</button>
            <button
              v-if="root.canDelete"
              class="danger-action"
              type="button"
              @click="removeComment(root)"
            >
              删除
            </button>
          </footer>

          <section v-if="root.replyCount" class="reply-thread" aria-label="楼中楼回复">
            <article
              v-for="reply in visibleReplies(root)"
              :key="reply.id"
              class="nested-reply"
            >
              <RouterLink :to="`/users/${reply.creator.uid}`" class="reply-avatar">
                <img
                  v-if="reply.creator.avatarUrl"
                  :src="reply.creator.avatarUrl"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span v-else>{{ reply.creator.name?.slice(0, 1) || "用" }}</span>
              </RouterLink>
              <div>
                <p class="reply-line">
                  <RouterLink :to="`/users/${reply.creator.uid}`">{{ reply.creator.name }}</RouterLink>
                  <span v-if="reply.replyTo">回复 @{{ reply.replyTo.name }}</span>
                  <em>Lv.{{ reply.creator.level }}</em>
                </p>
                <p class="comment-content">{{ reply.content }}</p>
                <footer class="comment-actions">
                  <time :datetime="reply.createdAt">{{ formatDateTime(reply.createdAt) }}</time>
                  <button type="button" @click="beginReply(root, reply)">回复</button>
                  <button
                    v-if="reply.canDelete"
                    class="danger-action"
                    type="button"
                    @click="removeComment(reply, root)"
                  >
                    删除
                  </button>
                </footer>
              </div>
            </article>

            <div class="thread-controls">
              <button
                v-if="root.replyCount > 3 || root.repliesExpanded"
                type="button"
                :disabled="root.repliesLoading"
                @click="expandReplies(root)"
              >
                {{
                  root.repliesLoading
                    ? "加载中…"
                    : root.repliesExpanded
                      ? "收起回复"
                      : `查看全部 ${root.replyCount} 条回复`
                }}
                <span aria-hidden="true">{{ root.repliesExpanded ? "⌃" : "⌄" }}</span>
              </button>
              <button
                v-if="root.repliesExpanded && root.repliesNextCursor"
                type="button"
                :disabled="root.repliesLoading"
                @click="loadMoreReplies(root)"
              >
                加载更多回复
              </button>
            </div>
          </section>

          <form
            v-if="replyingTo?.rootId === root.id"
            class="reply-composer"
            @submit.prevent="submitReply(root)"
          >
            <textarea
              v-model="replyText"
              maxlength="500"
              rows="2"
              :placeholder="`回复 @${replyingTo.name}`"
              autofocus
            ></textarea>
            <div>
              <small>{{ replyText.length }}/500</small>
              <button type="button" class="cancel-reply" @click="cancelReply">取消</button>
              <button
                :disabled="busyAction === `REPLY:${root.id}` || !replyText.trim()"
              >
                {{ busyAction === `REPLY:${root.id}` ? "回复中…" : "回复" }}
              </button>
            </div>
          </form>
        </div>
      </article>

      <div v-if="loadingComments" class="comment-skeletons" aria-label="评论加载中">
        <span v-for="index in 3" :key="index"></span>
      </div>
      <p v-else-if="!comments.length" class="no-comments">还没有评论，来发表第一条讨论吧。</p>

      <button
        v-if="commentsCursor"
        class="load-more-comments"
        type="button"
        :disabled="loadingMoreComments"
        @click="loadMoreComments"
      >
        {{ loadingMoreComments ? "加载中…" : "加载更多评论" }}
      </button>
      <p v-else-if="comments.length" class="comments-end">已经到底了</p>
    </div>
  </section>
</template>

<style scoped>
.content-interactions {
  width: 100%;
  margin: 28px 0;
  color: #25313b;
}

.discussion-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e3e8ec;
}

.discussion-heading > div:first-child {
  display: grid;
  gap: 2px;
}

.discussion-heading > div:first-child > span {
  color: #6d7f92;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .14em;
}

.discussion-heading h3 {
  margin: 0;
  font-size: 1.45rem;
}

.discussion-heading h3 small {
  margin-left: 4px;
  color: #7d8a96;
  font-size: .9rem;
  font-weight: 500;
}

.interaction-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #73808c;
  font-size: .82rem;
}

.interaction-summary button {
  min-height: 38px;
  padding: 7px 12px;
  border: 1px solid #d6dee5;
  border-radius: 999px;
  background: #fff;
  color: #536271;
  cursor: pointer;
}

.interaction-summary button > span {
  margin-right: 3px;
  font-size: 1rem;
}

.interaction-summary button.active {
  border-color: #6ca88f;
  background: #eef8f3;
  color: #247052;
}

.comment-composer {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 22px 0;
  border-bottom: 1px solid #edf0f2;
}

.composer-avatar img,
.composer-avatar span,
.root-avatar img,
.root-avatar span,
.reply-avatar img,
.reply-avatar span {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  border-radius: 50%;
  background: #e8f3ee;
  color: #2d765b;
  object-fit: cover;
  text-decoration: none;
}

.composer-avatar {
  width: 44px;
  height: 44px;
}

.composer-body,
.reply-composer {
  display: grid;
  gap: 8px;
}

.composer-body textarea,
.reply-composer textarea {
  width: 100%;
  resize: vertical;
  padding: 11px 13px;
  border: 1px solid #d7dee4;
  border-radius: 9px;
  background: #f7f9fa;
  color: #263442;
  font: inherit;
  line-height: 1.6;
}

.composer-body textarea:focus,
.reply-composer textarea:focus {
  border-color: #74a894;
  outline: 3px solid rgba(72, 143, 113, .12);
  background: #fff;
}

.composer-body > div,
.reply-composer > div {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.composer-body small,
.reply-composer small {
  margin-right: auto;
  color: #9aa4ad;
  font-size: .74rem;
}

.composer-body button,
.reply-composer button {
  min-width: 76px;
  min-height: 38px;
  padding: 8px 15px;
  border: 0;
  border-radius: 7px;
  background: #347c60;
  color: #fff;
  font: inherit;
  font-size: .84rem;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.interaction-message {
  margin: 12px 0 0 56px;
  color: #956000;
  font-size: .84rem;
}

.comment-list {
  min-width: 0;
}

.root-comment {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 14px;
  padding: 24px 0;
  border-bottom: 1px solid #edf0f2;
  content-visibility: auto;
  contain-intrinsic-size: auto 190px;
}

.root-avatar {
  width: 48px;
  height: 48px;
  text-decoration: none;
}

.root-body {
  min-width: 0;
}

.comment-author,
.reply-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin: 0;
}

.comment-author a,
.reply-line a {
  color: #376b88;
  font-size: .86rem;
  font-weight: 750;
  text-decoration: none;
}

.comment-author span,
.reply-line em {
  padding: 1px 5px;
  border-radius: 4px;
  background: #eff3f5;
  color: #82909a;
  font-size: .66rem;
  font-style: normal;
}

.reply-line > span {
  color: #61778a;
  font-size: .78rem;
}

.comment-content {
  margin: 7px 0 8px;
  color: #273642;
  font-size: .94rem;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 6px 14px;
  min-height: 30px;
}

.comment-actions time {
  color: #9aa3ab;
  font-size: .73rem;
}

.comment-actions button {
  min-height: 30px;
  padding: 3px 6px;
  border: 0;
  background: transparent;
  color: #7b8791;
  font: inherit;
  font-size: .75rem;
  cursor: pointer;
}

.comment-actions button:hover {
  color: #2e7559;
}

.comment-actions .danger-action:hover {
  color: #bd3d35;
}

.reply-thread {
  margin-top: 10px;
  padding: 4px 14px 12px;
  border-radius: 10px;
  background: #f7f9fa;
}

.nested-reply {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #e8ecef;
}

.nested-reply:last-of-type {
  border-bottom: 0;
}

.reply-avatar {
  width: 32px;
  height: 32px;
  text-decoration: none;
}

.nested-reply .comment-content {
  margin-top: 4px;
  font-size: .87rem;
}

.thread-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
}

.thread-controls button,
.load-more-comments {
  min-height: 40px;
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: #e8f2ee;
  color: #2d7358;
  font: inherit;
  font-size: .8rem;
  font-weight: 700;
  cursor: pointer;
}

.thread-controls button span {
  margin-left: 4px;
}

.reply-composer {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e1e7e4;
  border-radius: 10px;
  background: #fbfcfb;
}

.reply-composer .cancel-reply {
  border: 1px solid #d6dee0;
  background: #fff;
  color: #697781;
}

.comment-skeletons {
  display: grid;
  gap: 18px;
  padding: 24px 0;
}

.comment-skeletons span {
  display: block;
  height: 82px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f1f3f4 20%, #f8f9f9 40%, #f1f3f4 60%);
  background-size: 300% 100%;
  animation: comment-loading 1.25s infinite;
}

.load-more-comments {
  display: block;
  width: min(100%, 320px);
  margin: 22px auto 0;
}

.no-comments,
.comments-end {
  margin: 24px 0 0;
  color: #98a2aa;
  font-size: .82rem;
  text-align: center;
}

@keyframes comment-loading {
  from { background-position: 100% 0; }
  to { background-position: 0 0; }
}

@media (max-width: 720px) {
  .content-interactions {
    margin: 22px 0;
  }

  .discussion-heading {
    display: grid;
    align-items: start;
    gap: 12px;
  }

  .interaction-summary {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }

  .interaction-summary button {
    min-height: 44px;
  }

  .interaction-summary > span {
    margin-left: auto;
  }

  .comment-composer {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 9px;
    padding: 18px 0;
  }

  .composer-avatar {
    width: 36px;
    height: 36px;
  }

  .composer-body textarea {
    min-height: 96px;
  }

  .composer-body button,
  .reply-composer button {
    min-height: 44px;
  }

  .interaction-message {
    margin-left: 0;
  }

  .root-comment {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 10px;
    padding: 20px 0;
  }

  .root-avatar {
    width: 40px;
    height: 40px;
  }

  .comment-content {
    font-size: .91rem;
    line-height: 1.7;
  }

  .comment-actions {
    gap: 4px 10px;
  }

  .comment-actions button {
    min-width: 44px;
    min-height: 38px;
  }

  .reply-thread {
    margin: 9px 0 0 -50px;
    padding: 4px 10px 11px;
  }

  .nested-reply {
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 8px;
  }

  .reply-avatar {
    width: 30px;
    height: 30px;
  }

  .thread-controls {
    display: grid;
    grid-template-columns: 1fr;
  }

  .thread-controls button {
    width: 100%;
    min-height: 44px;
  }

  .reply-composer {
    margin-left: -50px;
  }
}

@media (max-width: 420px) {
  .discussion-heading h3 {
    font-size: 1.3rem;
  }

  .interaction-summary button {
    flex: 1;
  }

  .interaction-summary > span {
    width: 100%;
    margin-left: 0;
  }

  .root-comment {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 8px;
  }

  .root-avatar {
    width: 34px;
    height: 34px;
  }

  .reply-thread,
  .reply-composer {
    margin-left: -42px;
  }

  .composer-body > div,
  .reply-composer > div {
    flex-wrap: wrap;
  }

  .reply-composer small {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .comment-skeletons span {
    animation: none;
  }
}
</style>
