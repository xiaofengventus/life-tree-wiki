<script setup>
import { computed } from "vue";
import defaultCover from "@/assets/pic/jmgmksz-fox.png";

const props = defineProps({
  profile: { type: Object, required: true },
  owner: { type: Boolean, default: false },
});

const roleLabels = {
  USER: "时序创作者",
  ADMIN: "平台推荐管理员",
  COOPERATOR: "合作社团",
};

const coverPicture = computed(() => props.profile.homePicture || props.profile.home_picture || defaultCover);
const displayName = computed(() => props.profile.name || "未命名用户");
const profileRoleLabel = computed(() =>
  props.profile.uid === "U000001"
    ? "站点所有者"
    : (roleLabels[props.profile.role] || "时序创作者"),
);
</script>

<template>
  <section class="space-hero" aria-labelledby="space-profile-name">
    <img class="cover-picture" :src="coverPicture" alt="" />
    <div class="cover-wash"></div>
    <div class="cover-grain"></div>

    <div class="profile-summary">
      <span class="profile-avatar">
        <img
          v-if="profile.avatarUrl"
          :src="profile.avatarUrl"
          :alt="`${displayName}的头像`"
          decoding="async"
        />
        <i v-else>{{ displayName.slice(0, 1) || "时" }}</i>
      </span>
      <div class="profile-copy">
        <div class="name-row">
          <h1 id="space-profile-name">{{ displayName }}</h1>
          <span class="level-badge">Lv.{{ profile.level ?? 0 }}</span>
          <span class="role-badge">{{ profileRoleLabel }}</span>
        </div>
        <p>{{ profile.introduce || "在时间的枝桠上，记录每一次生长与选择。" }}</p>
        <div class="identity-line">
          <span>UID {{ profile.uid || "-" }}</span>
          <span>{{ owner ? "主人空间" : "公开空间" }}</span>
        </div>
      </div>
    </div>

    <div class="hero-side">
      <div class="space-stats" aria-label="空间数据">
        <div><strong>{{ profile.following || 0 }}</strong><span>关注</span></div>
        <div><strong>{{ profile.followers || 0 }}</strong><span>粉丝</span></div>
      </div>
      <slot name="actions"></slot>
    </div>
  </section>
</template>

<style scoped>
.space-hero {
  position: relative;
  height: 280px;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
  background: #eaf5f4;
  box-shadow: 0 18px 44px rgba(29, 78, 67, 0.1);
  isolation: isolate;
}

.cover-picture {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 48%;
  transform: scale(1.01);
}

.cover-wash {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(17, 52, 43, 0.24), transparent 52%),
    linear-gradient(0deg, rgba(12, 35, 30, 0.76) 0%, rgba(12, 35, 30, 0.04) 62%);
}

.cover-grain {
  position: absolute;
  inset: 0;
  opacity: 0.14;
  background-image: radial-gradient(rgba(255, 255, 255, 0.9) 0.65px, transparent 0.65px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.profile-summary {
  position: absolute;
  z-index: 1;
  left: 32px;
  bottom: 24px;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 18px;
  color: #fff;
}

.profile-avatar {
  display: grid;
  width: 94px;
  height: 94px;
  overflow: hidden;
  flex: 0 0 auto;
  place-items: center;
  border: 3px solid rgba(255, 255, 255, 0.94);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #1f6b57;
  font-size: 1.7rem;
  font-weight: 800;
  box-shadow: 0 10px 26px rgba(3, 20, 16, 0.2);
}

.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-avatar i { font-style: normal; }

.profile-copy {
  min-width: 0;
  text-shadow: 0 2px 12px rgba(7, 28, 23, 0.45);
}

.name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.name-row h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(1.55rem, 3vw, 2rem);
  font-weight: 780;
  letter-spacing: -0.035em;
}

.level-badge,
.role-badge {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  padding: 2px 8px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  background: rgba(18, 77, 63, 0.48);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 750;
  text-shadow: none;
  backdrop-filter: blur(8px);
}

.role-badge {
  background: rgba(255, 255, 255, 0.18);
}

.profile-copy p {
  max-width: 620px;
  margin: 6px 0 7px;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.92rem;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-line {
  display: flex;
  gap: 14px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.75rem;
}

.hero-side {
  position: absolute;
  z-index: 1;
  right: 28px;
  bottom: 26px;
  display: grid;
  justify-items: end;
  gap: 13px;
}

.space-stats {
  display: flex;
  gap: 24px;
  color: #fff;
  text-align: center;
  text-shadow: 0 2px 9px rgba(7, 28, 23, 0.42);
}

.space-stats div {
  display: grid;
  gap: 1px;
}

.space-stats strong {
  color: #fff;
  font-size: 1.05rem;
  font-weight: 750;
}

.space-stats span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.72rem;
}

@media (max-width: 760px) {
  .space-hero {
    height: 300px;
    border-radius: 0;
  }

  .cover-picture {
    object-position: 58% center;
  }

  .profile-summary {
    right: 18px;
    left: 18px;
    bottom: 22px;
    align-items: flex-end;
    gap: 13px;
  }

  .profile-avatar {
    width: 76px;
    height: 76px;
  }

  .profile-copy p {
    white-space: normal;
  }

  .hero-side {
    top: 18px;
    right: 18px;
    bottom: auto;
  }

  .space-stats {
    padding: 7px 12px;
    border-radius: 12px;
    background: rgba(14, 53, 44, 0.3);
    backdrop-filter: blur(9px);
  }
}
</style>
