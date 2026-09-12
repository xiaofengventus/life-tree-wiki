<template>
  <section
    class="create-post-page ui-pdf-page-shell"
    :class="[
      {
        'ui-pdf-mode': isUiPdfMode,
      },
      isUiPdfMode ? `pdf-template-${uiPdfTemplate}` : '',
      isUiPdfMode ? `pdf-density-${uiPdfDensity}` : '',
      isUiPdfMode ? `pdf-columns-${uiPdfColumns}` : '',
    ]"
    :style="uiPdfPageStyle"
  >
    <form class="create-post-form" @submit.prevent="submitPost('PUBLIC')">
      <Teleport to="body">
        <div
          v-if="insertPanelOpen"
          class="insert-tools-backdrop"
          role="presentation"
          @click.self="closeInsertPanel"
        >
          <section
            class="insert-tools-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="insert-tools-title"
          >
            <header class="insert-tools-heading">
              <button
                v-if="insertPanelSection !== 'menu'"
                type="button"
                class="insert-tools-back"
                @click="showInsertPanelSection('menu')"
              >
                ← 返回
              </button>
              <div>
                <h2 id="insert-tools-title">{{ insertPanelTitle }}</h2>
                <p>选择内容类型后，继续使用原有的编辑和插入方式。</p>
              </div>
              <button
                type="button"
                class="insert-tools-close"
                aria-label="关闭插入面板"
                @click="closeInsertPanel"
              >
                ×
              </button>
            </header>

            <div v-if="insertPanelSection === 'menu'" class="insert-tools-menu">
              <button type="button" @click="showInsertPanelSection('sidebar')">
                <span class="insert-tool-icon">▦</span>
                <strong>卡片</strong>
                <small>创建生物卡片或自定义卡片，并选择展示位置</small>
              </button>
              <button type="button" @click="showInsertPanelSection('tree')">
                <span class="insert-tool-icon">🌳</span>
                <strong>Research 进化树块</strong>
                <small>插入可缩放、可折叠的只读进化树</small>
              </button>
              <button type="button" @click="showInsertPanelSection('markdown')">
                <span class="insert-tool-icon">M↓</span>
                <strong>Markdown 导入</strong>
                <small>预览后插入到当前光标处</small>
              </button>
              <button type="button" @click="openContentMediaLibrary">
                <span class="insert-tool-icon">▧</span>
                <strong>已上传图片</strong>
                <small>从个人媒体库选择图片并填写注释</small>
              </button>
              <button
                v-if="isUiPdfMode"
                type="button"
                @click="showInsertPanelSection('pdf-layout')"
              >
                <span class="insert-tool-icon">📐</span>
                <strong>PDF 排版模板</strong>
                <small>选择学术、极简或杂志版式与正文栏数</small>
              </button>
              <button
                v-if="isUiPdfMode"
                type="button"
                @click="showInsertPanelSection('pdf-components')"
              >
                <span class="insert-tool-icon">🧩</span>
                <strong>PDF 组件</strong>
                <small>插入封面、摘要框、数据表和图注等排版块</small>
              </button>
              <button
                v-if="isUiPdfMode"
                type="button"
                @click="insertUiPdfPageBreak"
              >
                <span class="insert-tool-icon">⤓</span>
                <strong>插入分页</strong>
                <small>在当前位置结束本页，PDF 导出时另起新页</small>
              </button>
            </div>

            <section
              v-if="insertPanelSection === 'sidebar'"
              class="classification-card-editor insert-tool-section"
              aria-labelledby="classification-card-label"
            >
              <div class="classification-card-heading">
                <div>
                  <strong id="classification-card-label">文章卡片</strong>
                  <small
                    >每张卡片可显示在正文当前位置、目录下方，或同时显示在两个位置。</small
                  >
                </div>
                <div class="add-sidebar-card-actions">
                  <button
                    type="button"
                    :disabled="sidebarCards.length >= 8"
                    @click="addSidebarCard('taxonomy')"
                  >
                    ＋ 生物卡片
                  </button>
                  <button
                    type="button"
                    :disabled="sidebarCards.length >= 8"
                    @click="addSidebarCard('custom')"
                  >
                    ＋ 自定义卡片
                  </button>
                </div>
              </div>

              <article
                v-for="(card, cardIndex) in sidebarCards"
                :key="card.id"
                class="sidebar-card-editor-item"
              >
                <header>
                  <strong>卡片 {{ cardIndex + 1 }}</strong>
                  <select
                    v-model="card.type"
                    @change="changeSidebarCardType(card)"
                  >
                    <option value="taxonomy">生物卡片</option>
                    <option value="custom">自定义卡片</option>
                  </select>
                  <button
                    type="button"
                    class="remove-sidebar-card"
                    @click="removeSidebarCard(cardIndex)"
                  >
                    删除卡片
                  </button>
                </header>

                <div class="classification-card-settings">
                  <label>
                    <span>卡片标题</span>
                    <input
                      v-model.trim="card.title"
                      maxlength="80"
                      :placeholder="
                        card.type === 'taxonomy' ? '科学分类' : '自定义卡片'
                      "
                    />
                  </label>
                  <ColorPaletteInput v-model="card.color" label="卡片颜色" />
                </div>

                <fieldset class="card-placement-options">
                  <legend>展示位置（可多选）</legend>
                  <label>
                    <input
                      type="checkbox"
                      :checked="card.placements.includes('body')"
                      :disabled="
                        card.placements.length === 1 &&
                        card.placements.includes('body')
                      "
                      @change="
                        toggleCardPlacement(card, 'body', $event.target.checked)
                      "
                    />
                    <span>正文插入</span>
                    <small>首次勾选时插入到当前光标位置</small>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      :checked="card.placements.includes('outline')"
                      :disabled="
                        card.placements.length === 1 &&
                        card.placements.includes('outline')
                      "
                      @change="
                        toggleCardPlacement(
                          card,
                          'outline',
                          $event.target.checked,
                        )
                      "
                    />
                    <span>目录下插入</span>
                    <small>移动端显示在正文上方</small>
                  </label>
                </fieldset>

                <div class="sidebar-card-image-editor">
                  <label>
                    <span>{{
                      card.imagePreview ? "更换图片" : "插入图片"
                    }}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      @change="chooseSidebarCardImage($event, card)"
                    />
                  </label>
                  <button
                    type="button"
                    class="library-button"
                    @click="openMediaPicker('card', card)"
                  >
                    从图片库选择
                  </button>
                  <template v-if="card.imagePreview">
                    <img :src="card.imagePreview" alt="卡片图片预览" />
                    <input
                      v-model.trim="card.imageCaption"
                      maxlength="120"
                      placeholder="图片说明（可选）"
                    />
                    <button type="button" @click="removeSidebarCardImage(card)">
                      移除图片
                    </button>
                  </template>
                </div>

                <div class="classification-rank-rows">
                  <div
                    v-for="(row, rowIndex) in card.rows"
                    :key="row.id"
                    class="classification-rank-row"
                  >
                    <template v-if="card.type === 'taxonomy'">
                      <TaxonomyRankPicker
                        v-model="row.rankKey"
                        :aria-label="`卡片 ${cardIndex + 1} 的第 ${rowIndex + 1} 个分类阶元`"
                      />
                      <input
                        v-model.trim="row.value"
                        maxlength="240"
                        placeholder="填写分类名称，例如 Eukaryota"
                      />
                    </template>
                    <template v-else>
                      <input
                        v-model.trim="row.label"
                        maxlength="60"
                        placeholder="字段名称"
                      />
                      <input
                        v-model.trim="row.value"
                        maxlength="240"
                        placeholder="字段内容"
                      />
                    </template>
                    <button
                      type="button"
                      aria-label="删除这一行"
                      @click="removeSidebarCardRow(card, rowIndex)"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div class="classification-card-actions">
                  <button
                    type="button"
                    class="secondary-button"
                    :disabled="card.rows.length >= 60"
                    @click="addSidebarCardRow(card)"
                  >
                    {{
                      card.type === "taxonomy"
                        ? "＋ 添加分类阶元"
                        : "＋ 添加自定义字段"
                    }}
                  </button>
                  <small v-if="card.type === 'taxonomy'"
                    >同一阶元可重复选择，只展示已填写内容的行。</small
                  >
                  <small v-else>字段名称和内容均可自定义。</small>
                </div>

                <table
                  class="classification-card-preview"
                  :style="{
                    '--classification-color': card.color,
                    '--classification-tint': cardTint(card),
                    '--classification-header-text': cardHeaderText(card),
                  }"
                >
                  <caption>
                    {{
                      card.title ||
                      (card.type === "taxonomy" ? "科学分类" : "自定义卡片")
                    }}
                  </caption>
                  <tbody>
                    <tr
                      v-if="card.imagePreview"
                      class="classification-preview-image"
                    >
                      <td colspan="2">
                        <img
                          :src="card.imagePreview"
                          :alt="card.imageCaption"
                        /><small v-if="card.imageCaption">{{
                          card.imageCaption
                        }}</small>
                      </td>
                    </tr>
                    <tr v-for="row in cardPreviewRows(card)" :key="row.id">
                      <th>
                        <template v-if="card.type === 'taxonomy'"
                          ><span>{{ row.rank.zh }}</span
                          ><small>{{ row.rank.en }}</small></template
                        >
                        <span v-else>{{ row.label || "字段" }}</span>
                      </th>
                      <td>{{ row.value || "—" }}</td>
                    </tr>
                    <tr
                      v-if="!cardPreviewRows(card).length && !card.imagePreview"
                    >
                      <td colspan="2">添加字段后在这里预览</td>
                    </tr>
                  </tbody>
                </table>
              </article>

              <p v-if="!sidebarCards.length" class="no-sidebar-cards">
                尚未添加卡片。最多可添加 8 张。
              </p>
            </section>

            <div
              v-if="insertPanelSection === 'tree'"
              class="tree-embed-picker insert-tool-section"
            >
              <label for="post-tree-embed">插入 Research 进化树块</label>
              <select id="post-tree-embed" v-model="selectedTreeId">
                <option value="">选择一棵已发布的用户进化树</option>
                <option
                  v-for="tree in researchTrees"
                  :key="tree.id"
                  :value="tree.id"
                >
                  {{ tree.title }} · {{ tree.creator }}
                </option>
              </select>
              <button
                type="button"
                class="secondary-button"
                :disabled="!selectedTreeId"
                @click="insertResearchTree"
              >
                插入树块
              </button>
              <small>{{
                treeListMessage || "文章中将显示可缩放、可折叠的只读进化树。"
              }}</small>
            </div>
            <section
              v-if="insertPanelSection === 'markdown'"
              class="markdown-importer insert-tool-section"
              aria-labelledby="markdown-import-title"
            >
              <details open>
                <summary id="markdown-import-title">
                  从 Markdown 导入正文
                </summary>
                <p>
                  数学公式支持行内 <code>$...$</code>、<code>\(...\)</code>，
                  以及独立公式块 <code>$$...$$</code>、<code>\[...\]</code>；
                  中文语境下裸写的 LaTeX（如
                  <code>\vec{r}=x(t)\vec{i}</code>）也会自动识别。
                </p>
                <p>
                  支持标题、列表、引用、代码、链接和图片。原始 HTML
                  不会执行，危险链接会被移除。
                </p>
                <div class="markdown-tabs" role="tablist">
                  <button
                    type="button"
                    class="markdown-tab"
                    :class="{ active: markdownTab === 'code' }"
                    role="tab"
                    @click="markdownTab = 'code'"
                  >
                    代码
                  </button>
                  <button
                    type="button"
                    class="markdown-tab"
                    :class="{ active: markdownTab === 'preview' }"
                    role="tab"
                    @click="switchMarkdownTab('preview')"
                  >
                    预览
                  </button>
                </div>
                <textarea
                  v-if="markdownTab === 'code'"
                  v-model="markdownSource"
                  rows="10"
                  maxlength="500000"
                  placeholder="在这里粘贴或编写 Markdown / LaTeX……"
                ></textarea>
                <article
                  v-else
                  class="markdown-preview markdown-preview-live"
                  v-html="markdownPreview"
                ></article>
                <div class="markdown-actions">
                  <button
                    type="button"
                    class="secondary-button"
                    :disabled="!markdownSource.trim()"
                    @click="switchMarkdownTab('preview')"
                  >
                    预览
                  </button>
                  <button
                    type="button"
                    class="secondary-button"
                    :disabled="!markdownSource.trim()"
                    @click="insertMarkdown"
                  >
                    插入到光标处
                  </button>
                </div>
                <p v-if="markdownMessage" class="markdown-message">
                  {{ markdownMessage }}
                </p>
              </details>
            </section>

            <section
              v-if="isUiPdfMode && insertPanelSection === 'pdf-layout'"
              class="ui-pdf-layout-picker insert-tool-section"
              aria-labelledby="ui-pdf-layout-title"
            >
              <h2 id="ui-pdf-layout-title">排版模板</h2>
              <p>模板会同时作用于编辑页面和 PDF 导出，不会改变正文内容。</p>
              <div class="ui-pdf-template-grid">
                <button
                  v-for="template in uiPdfTemplates"
                  :key="template.value"
                  type="button"
                  :class="{ active: uiPdfTemplate === template.value }"
                  @click="uiPdfTemplate = template.value"
                >
                  <span class="ui-pdf-template-preview" aria-hidden="true">
                    <i></i><i></i><i></i>
                  </span>
                  <strong>{{ template.title }}</strong>
                  <small>{{ template.detail }}</small>
                </button>
              </div>

              <fieldset class="ui-pdf-layout-fieldset">
                <legend>正文栏数</legend>
                <div class="ui-pdf-option-row">
                  <button
                    v-for="option in uiPdfColumnOptions"
                    :key="option.value"
                    type="button"
                    :class="{ active: uiPdfColumns === option.value }"
                    @click="uiPdfColumns = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </fieldset>

              <fieldset class="ui-pdf-layout-fieldset">
                <legend>行距密度</legend>
                <div class="ui-pdf-option-row">
                  <button
                    v-for="option in uiPdfDensityOptions"
                    :key="option.value"
                    type="button"
                    :class="{ active: uiPdfDensity === option.value }"
                    @click="uiPdfDensity = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </fieldset>
            </section>

            <section
              v-if="isUiPdfMode && insertPanelSection === 'pdf-components'"
              class="ui-pdf-component-picker insert-tool-section"
              aria-labelledby="ui-pdf-component-title"
            >
              <h2 id="ui-pdf-component-title">PDF 组件</h2>
              <p>组件会插入到当前光标位置，插入后仍可直接编辑。</p>
              <div class="ui-pdf-component-grid">
                <button
                  v-for="component in uiPdfComponents"
                  :key="component.value"
                  type="button"
                  @click="insertUiPdfComponent(component.value)"
                >
                  <strong>{{ component.title }}</strong>
                  <small>{{ component.detail }}</small>
                </button>
              </div>
            </section>
          </section>
        </div>
      </Teleport>
      <Teleport to="body">
        <div
          v-if="insertToolbarVisible && floatingToolbarsEnabled"
          ref="insertToolbarRef"
          class="caret-insert-toolbar"
          :style="insertToolbarStyle"
          role="toolbar"
          aria-label="插入格式栏"
          @mousedown.prevent
        >
          <span class="caret-insert-toolbar-label">插入</span>
          <button
            type="button"
            title="上传本地图片"
            aria-label="上传本地图片"
            @click="chooseInlineImage"
          >
            <span aria-hidden="true">▧↑</span>
          </button>
          <button
            type="button"
            title="从图片库选择"
            aria-label="从图片库选择"
            @click="openInlineMediaLibrary"
          >
            <span aria-hidden="true">▧</span>
          </button>
          <span class="caret-insert-divider" aria-hidden="true"></span>
          <button
            type="button"
            :title="`插入正文引用\n${formatToolbarShortcut('mod+Alt+K')}`"
            aria-label="插入正文引用"
            @click="openInlineCitation"
          >
            <span aria-hidden="true">[1]</span>
          </button>
          <button
            type="button"
            :title="`插入数学公式\n${formatToolbarShortcut('mod+Alt+M')}`"
            aria-label="插入数学公式"
            @click="openInlineFormula"
          >
            <span aria-hidden="true">Σ</span>
          </button>
          <span class="caret-insert-divider" aria-hidden="true"></span>
          <button
            type="button"
            title="配置文章卡片"
            aria-label="配置文章卡片"
            @click="openInsertToolSection('sidebar')"
          >
            <span aria-hidden="true">▦</span>
          </button>
          <button
            type="button"
            title="插入 Research 进化树块"
            aria-label="插入 Research 进化树块"
            @click="openInsertToolSection('tree')"
          >
            <span aria-hidden="true">🌳</span>
          </button>
          <button
            type="button"
            title="从 Markdown 导入正文"
            aria-label="从 Markdown 导入正文"
            @click="openInsertToolSection('markdown')"
          >
            <span aria-hidden="true">M↓</span>
          </button>
        </div>
      </Teleport>
      <input
        ref="inlineImageInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        @change="handleInlineImageChange"
      />
      <div class="editor-layout">
        <!-- 左侧参考文献管理面板 -->
        <aside v-show="!citationPanelCollapsed" class="citation-panel">
          <div class="citation-panel-body">
            <!-- 添加新引用按钮 -->
            <button
              type="button"
              class="citation-add-btn"
              @click="quickAddCitation"
            >
              ＋ 添加引用
            </button>

            <!-- 引用列表 -->
            <div class="citation-list" v-if="sortedCitations.length">
              <article
                v-for="citation in sortedCitations"
                :key="citation.number"
                class="citation-item"
                :class="{
                  unused: citationUsageCount(citation.number) === 0,
                }"
              >
                <header class="citation-item-header">
                  <strong class="citation-number"
                    >[{{ citation.number }}]</strong
                  >
                  <span
                    class="citation-usage"
                    :class="{
                      unused: citationUsageCount(citation.number) === 0,
                    }"
                  >
                    {{
                      citationUsageCount(citation.number)
                        ? `${citationUsageCount(citation.number)} 处引用`
                        : "未使用"
                    }}
                  </span>
                  <div class="citation-item-actions">
                    <button
                      type="button"
                      class="citation-action-btn"
                      @click="toggleCitationEdit(citation)"
                    >
                      {{
                        editingCitationNumber === citation.number
                          ? "收起"
                          : "编辑"
                      }}
                    </button>
                    <button
                      type="button"
                      class="citation-action-btn delete"
                      :class="{
                        blocked: citationUsageCount(citation.number) > 0,
                      }"
                      :disabled="citationUsageCount(citation.number) > 0"
                      :title="
                        citationUsageCount(citation.number) > 0
                          ? '请先删除正文中的引用标记'
                          : '删除此引用'
                      "
                      @click="quickDeleteCitation(citation)"
                    >
                      删除
                    </button>
                  </div>
                </header>

                <!-- 引用文本预览/编辑 -->
                <div class="citation-item-content">
                  <textarea
                    v-if="editingCitationNumber === citation.number"
                    v-model="editingCitationText"
                    rows="4"
                    maxlength="4000"
                    class="citation-edit-textarea"
                    placeholder="引用文本..."
                    @blur="saveCitationText"
                  ></textarea>
                  <p v-else class="citation-text-preview">
                    {{ citation.text || "(空)" }}
                  </p>
                </div>

                <!-- 插入到光标处 -->
                <button
                  type="button"
                  class="citation-insert-btn"
                  @click="insertCitationNumber(citation.number)"
                >
                  插入 [{{ citation.number }}]
                </button>
              </article>
            </div>

            <!-- 空状态 -->
            <p v-else class="citation-empty">
              暂无参考文献，点击上方按钮添加。
            </p>
          </div>
        </aside>

        <!-- 右侧编辑器 -->
        <div
          ref="editorWrapperRef"
          class="editor-wrapper"
          :class="{ 'floating-tools-disabled': !floatingToolbarsEnabled }"
        >
          <div class="editor-toolbar-fixed">
            <Toolbar
              v-if="editMode === 'rich'"
              :editor="editorRef"
              :default-config="toolbarConfig"
              mode="default"
            />
            <div v-else class="markdown-mode-toolbar-hint">
              <span class="markdown-mode-badge">Markdown 模式</span>
              <span class="markdown-mode-tip"
                >直接编写 Markdown 与 LaTeX 公式，预览所见即所得</span
              >
            </div>
            <div class="editor-toolbar-extras">
              <div class="edit-mode-switch">
                <button
                  type="button"
                  class="edit-mode-btn"
                  :class="{ active: editMode === 'rich' }"
                  :aria-pressed="editMode === 'rich'"
                  @click="switchToRichMode"
                >
                  富文本
                </button>
                <button
                  type="button"
                  class="edit-mode-btn"
                  :class="{ active: editMode === 'markdown' }"
                  :aria-pressed="editMode === 'markdown'"
                  @click="switchToMarkdownMode"
                >
                  Markdown
                </button>
              </div>
              <div class="insert-card-actions">
                <button
                  type="button"
                  class="insert-card-btn"
                  @click="insertCardIntoEditor('taxonomy')"
                >
                  ＋ 生物卡片
                </button>
                <button
                  type="button"
                  class="insert-card-btn"
                  @click="insertCardIntoEditor('custom')"
                >
                  ＋ 自定义卡片
                </button>
              </div>
              <button
                type="button"
                class="floating-tools-toggle"
                :class="{ active: floatingToolbarsEnabled }"
                :aria-pressed="floatingToolbarsEnabled"
                @click="toggleFloatingToolbars"
              >
                <span class="floating-tools-toggle-track" aria-hidden="true"
                  ><i></i
                ></span>
                浮动工具栏{{ floatingToolbarsEnabled ? "已开启" : "已关闭" }}
              </button>
              <button
                type="button"
                class="citation-panel-toggle-btn"
                :class="{ active: !citationPanelCollapsed }"
                @click="citationPanelCollapsed = !citationPanelCollapsed"
              >
                📚 参考文献
              </button>
              <div class="io-dropdown">
                <button
                  type="button"
                  class="io-dropdown-btn"
                  @click="
                    importMenuOpen = !importMenuOpen;
                    exportMenuOpen = false;
                  "
                >
                  导入 ▾
                </button>
                <div v-show="importMenuOpen" class="io-dropdown-menu">
                  <button type="button" @click="handleImport('docx')">
                    📄 Word 文档
                  </button>
                  <button type="button" @click="handleImport('md')">
                    📝 Markdown
                  </button>
                  <button type="button" @click="handleImport('html')">
                    🌐 富文本HTML
                  </button>
                </div>
              </div>
              <div class="io-dropdown">
                <button
                  type="button"
                  class="io-dropdown-btn"
                  @click="
                    exportMenuOpen = !exportMenuOpen;
                    importMenuOpen = false;
                  "
                >
                  导出 ▾
                </button>
                <div v-show="exportMenuOpen" class="io-dropdown-menu">
                  <button type="button" @click="handleExport('pdf')">
                    📕 PDF 文档
                  </button>
                  <button type="button" @click="handleExport('docx')">
                    📄 Word 文档
                  </button>
                  <button type="button" @click="handleExport('md')">
                    📝 Markdown
                  </button>
                  <button type="button" @click="handleExport('html')">
                    🌐 富文本HTML
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Editor
            v-if="editMode === 'rich'"
            v-model="content"
            :default-config="editorConfig"
            mode="default"
            class="post-editor"
            @on-created="handleCreated"
          />
          <!-- Markdown 编辑模式：代码 / 预览 -->
          <div v-else class="markdown-editor">
            <div class="markdown-editor-tabs" role="tablist">
              <button
                type="button"
                class="markdown-editor-tab"
                :class="{ active: markdownEditorTab === 'code' }"
                role="tab"
                @click="switchMarkdownEditorTab('code')"
              >
                代码
              </button>
              <button
                type="button"
                class="markdown-editor-tab"
                :class="{ active: markdownEditorTab === 'preview' }"
                role="tab"
                @click="switchMarkdownEditorTab('preview')"
              >
                预览
              </button>
            </div>
            <textarea
              v-if="markdownEditorTab === 'code'"
              v-model="markdownEditorSource"
              class="markdown-editor-textarea"
              placeholder="在这里编写 Markdown / LaTeX……&#10;&#10;行内公式：$x^2$ 或 \(x^2\)&#10;块级公式：$$...$$ 或 \[...\]&#10;中文语境下裸写 \vec{r}=x(t)\vec{i} 也能自动识别"
              spellcheck="false"
            ></textarea>
            <article
              v-else
              class="markdown-editor-preview"
              v-html="markdownEditorPreview"
            ></article>
          </div>
        </div>
      </div>
      <p v-if="imageMessage" class="image-message" aria-live="polite">
        {{ imageMessage }}
      </p>
      <p v-if="importExportMessage" class="image-message" aria-live="polite">
        {{ importExportMessage }}
      </p>

      <Teleport to="body">
        <article
          v-if="uiPdfPrintOpen"
          class="ui-pdf-print-root"
          :class="[
            `pdf-template-${uiPdfTemplate}`,
            `pdf-density-${uiPdfDensity}`,
            `pdf-columns-${uiPdfColumns}`,
          ]"
          :style="uiPdfPageStyle"
          aria-hidden="true"
        >
          <div
            v-if="pdfPrintCards.length"
            class="ui-pdf-print-cards"
            v-html="pdfPrintCards.map(classificationCardHtml).join('')"
          ></div>
          <main class="ui-pdf-print-body" v-html="uiPdfPrintHtml"></main>
          <section
            v-if="sortedCitations.length"
            class="ui-pdf-print-references"
          >
            <h2>参考文献</h2>
            <ol>
              <li v-for="citation in sortedCitations" :key="citation.number">
                {{ citation.text }}
              </li>
            </ol>
          </section>
        </article>
      </Teleport>

      <!-- 内容区下方：封面和元数据 -->
      <div v-if="!isUiPdfMode" class="post-metadata-section">
        <section class="cover-editor" aria-labelledby="post-cover-label">
          <div class="cover-heading">
            <div>
              <strong id="post-cover-label">文章封面</strong>
              <small
                >将在
                Research、用户空间和文章详情页展示，建议选择主体清晰的横图。</small
              >
            </div>
            <div class="cover-actions">
              <input
                ref="coverInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                @change="chooseCover"
              />
              <button
                type="button"
                class="secondary-button"
                @click="coverInput?.click()"
              >
                {{ coverPreview ? "重新选择" : "选择封面" }}
              </button>
              <button
                type="button"
                class="library-button"
                @click="openMediaPicker('cover')"
              >
                从图片库选择
              </button>
              <button
                v-if="coverPreview"
                type="button"
                class="remove-cover"
                @click="removeCover"
              >
                移除封面
              </button>
            </div>
          </div>
          <div class="cover-preview" :class="{ empty: !coverPreview }">
            <img v-if="coverPreview" :src="coverPreview" alt="文章封面预览" />
            <span v-else>1200 × 675 · 16:9</span>
          </div>
        </section>

        <div class="metadata-grid">
          <div class="metadata-item">
            <label for="post-creator">创建者</label>
            <input id="post-creator" :value="creator" type="text" readonly />
            <small>拥有管理权限的创建者</small>
          </div>

          <div class="metadata-item">
            <label for="post-author">作者</label>
            <input
              id="post-author"
              v-model="author"
              type="text"
              placeholder="可填写多人，用逗号分隔"
            />
            <small>实际文章作者</small>
          </div>

          <div class="metadata-item">
            <label for="post-time">提交时间</label>
            <input
              id="post-time"
              :value="submissionTime"
              type="text"
              readonly
            />
            <small>由系统生成</small>
          </div>

          <div class="metadata-item">
            <label for="post-views">浏览量</label>
            <input id="post-views" :value="viewCount" type="text" readonly />
            <small>新文章默认从 0 开始</small>
          </div>
        </div>
      </div>

      <div v-if="!isUiPdfMode" class="tag-section">
        <label for="post-tag-input">关键词 / 标签</label>
        <div class="tag-input-row">
          <input
            id="post-tag-input"
            v-model="tagInput"
            type="text"
            placeholder="输入标签后按 Enter 添加"
            @keydown.enter.prevent="addTag"
          />
          <button type="button" class="secondary-button" @click="addTag">
            添加标签
          </button>
        </div>
        <div v-if="tags.length" class="tag-list">
          <span v-for="(tag, index) in tags" :key="tag" class="tag-item">
            {{ tag }}
            <button
              type="button"
              aria-label="删除标签"
              @click="removeTag(index)"
            >
              ×
            </button>
          </span>
        </div>
      </div>

      <div v-if="!isUiPdfMode" class="submission-section">
        <h2>提交声明</h2>
        <label class="agreement-row">
          <input v-model="agreementAccepted" type="checkbox" />
          <span>我确认文章内容符合社区发布规范。</span>
        </label>

        <div class="submission-options">
          <label for="post-license">协议选择</label>
          <select id="post-license" v-model="license">
            <option value="支持闭源">支持闭源</option>
            <option value="CC BY-NC-SA 4.0">CC BY-NC-SA 4.0</option>
            <option value="CC BY 4.0">CC BY 4.0</option>
          </select>
          <small>如果是关联到Communition的文件强烈建议选择开源</small>
        </div>

        <label for="post-note">提交说明</label>
        <textarea
          id="post-note"
          v-model="changeNote"
          rows="3"
          placeholder="说明本次提交的内容，类似 git commit 的说明"
        ></textarea>

        <label v-if="isEditing" class="minor-change-option">
          <input v-model="isMinorChange" type="checkbox" />
          <span>小型修改（不生成提交记录，提交说明也不能写）</span>
        </label>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <div v-if="!isUiPdfMode" class="server-save-actions">
        <button
          v-if="!isEditing || isPrivateWork"
          type="button"
          class="private-save-button"
          :disabled="!canSavePrivate"
          @click="submitPost('PRIVATE')"
        >
          {{
            submitting
              ? "保存中……"
              : isPrivateWork
                ? "更新仅自己可见"
                : "保存为仅自己可见"
          }}
        </button>
        <button type="submit" :disabled="!canSubmit">
          {{
            submitting
              ? "提交中……"
              : isPrivateWork
                ? "公开发布"
                : isEditing
                  ? "更新帖子"
                  : "创建帖子"
          }}
        </button>
      </div>
      <small
        v-if="!isUiPdfMode && (!isEditing || isPrivateWork)"
        class="private-save-hint"
      >
        私密文章保存在服务器，可跨设备继续编辑；文章和进化树合计最多 5 个。
      </small>
    </form>

    <ImageCropperDialog
      ref="coverCropper"
      title="调整文章封面"
      :aspect-ratio="16 / 9"
      :output-width="1200"
      :output-height="675"
      @confirm="applyCoverCrop"
    />
    <MediaImagePicker
      :open="mediaPickerOpen"
      :description-label="mediaPickerDescriptionLabel"
      :description-required="mediaPickerTarget !== 'cover'"
      :show-description="mediaPickerTarget !== 'cover'"
      :initial-description="mediaPickerInitialDescription"
      @close="closeMediaPicker"
      @select="useLibraryImage"
    />
    <Teleport to="body">
      <div
        v-if="imageDialogOpen"
        class="content-image-dialog-backdrop"
        role="presentation"
        @click.self="closeImageDialog"
      >
        <section
          class="content-image-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="content-image-dialog-title"
        >
          <header>
            <div>
              <h2 id="content-image-dialog-title">
                {{ editingImageNode ? "修改图片和注释" : "插入本地图片" }}
              </h2>
              <p>图片与注释将作为一个完整容器插入正文。</p>
            </div>
            <button
              type="button"
              aria-label="关闭图片窗口"
              @click="closeImageDialog"
            >
              ×
            </button>
          </header>
          <figure class="content-image-dialog-preview">
            <img
              :src="imageDialogPreview"
              :alt="imageDialogDescription || '图片预览'"
            />
            <figcaption>
              {{ imageDialogDescription || "填写注释后在这里预览" }}
            </figcaption>
          </figure>
          <label class="content-image-dialog-file">
            <span>{{
              editingImageNode ? "替换本地图片" : "重新选择图片"
            }}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              @change="chooseImageDialogFile"
            />
          </label>
          <label class="content-image-dialog-caption">
            <span>图片注释与无障碍描述</span>
            <textarea
              v-model="imageDialogDescription"
              rows="3"
              maxlength="200"
              placeholder="说明图片中是什么，以及它与正文的关系"
            ></textarea>
          </label>
          <footer>
            <button type="button" class="cancel" @click="closeImageDialog">
              取消
            </button>
            <button
              type="button"
              class="confirm"
              :disabled="!imageDialogPreview || !imageDialogDescription.trim()"
              @click="confirmImageDialog"
            >
              {{ editingImageNode ? "保存修改" : "插入图片" }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="citationDialogOpen"
        class="citation-dialog-backdrop"
        role="presentation"
        @click.self="closeCitationDialog"
      >
        <section
          class="citation-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="citation-dialog-title"
        >
          <header>
            <div>
              <h2 id="citation-dialog-title">插入正文引用</h2>
              <p>编号固定；再次引用同一资料时请选择已有引用。</p>
            </div>
            <button
              type="button"
              aria-label="关闭引用窗口"
              @click="closeCitationDialog"
            >
              ×
            </button>
          </header>

          <div class="citation-mode-actions">
            <button
              type="button"
              :class="{ active: citationMode === 'existing' }"
              :disabled="!citations.length"
              @click="changeCitationMode('existing')"
            >
              选择已有引用
            </button>
            <button
              type="button"
              :class="{ active: citationMode === 'new' }"
              @click="changeCitationMode('new')"
            >
              Add new · [{{ nextCitationNumber }}]
            </button>
          </div>

          <div
            v-if="citationMode === 'existing'"
            class="existing-citation-pane"
          >
            <label class="citation-search">
              <span>搜索已有引用</span>
              <input
                v-model.trim="citationSearchQuery"
                type="search"
                placeholder="输入编号、作者、标题或期刊"
              />
            </label>
            <div class="existing-citation-list">
              <article
                v-for="citation in filteredCitations"
                :key="citation.number"
                class="existing-citation-row"
                :class="{
                  selected: selectedCitationNumber === citation.number,
                }"
              >
                <button
                  type="button"
                  class="citation-select"
                  @click="selectCitation(citation.number)"
                >
                  <strong>[{{ citation.number }}]</strong>
                  <span>{{ citation.text }}</span>
                  <small
                    :class="{
                      unused: citationUsageCount(citation.number) === 0,
                    }"
                  >
                    {{
                      citationUsageCount(citation.number)
                        ? `正文 ${citationUsageCount(citation.number)} 处`
                        : "未使用"
                    }}
                  </small>
                </button>
                <div class="citation-row-actions">
                  <button type="button" @click="startEditingCitation(citation)">
                    编辑
                  </button>
                  <button
                    type="button"
                    class="delete"
                    :class="{
                      blocked: citationUsageCount(citation.number) > 0,
                    }"
                    :aria-disabled="citationUsageCount(citation.number) > 0"
                    :title="
                      citationUsageCount(citation.number) > 0
                        ? '请先删除正文中的蓝色上标'
                        : '删除这条未使用的引用'
                    "
                    @click="requestCitationDelete(citation)"
                  >
                    删除
                  </button>
                </div>
                <div
                  v-if="editingCitationNumber === citation.number"
                  class="citation-inline-editor"
                >
                  <textarea
                    v-model="editingCitationText"
                    rows="5"
                    maxlength="4000"
                    aria-label="编辑引用文字"
                  ></textarea>
                  <div>
                    <small>{{ editingCitationText.trim().length }}/4000</small>
                    <button type="button" @click="cancelEditingCitation">
                      取消
                    </button>
                    <button
                      type="button"
                      class="save"
                      :disabled="!editingCitationText.trim()"
                      @click="saveCitationText"
                    >
                      保存修改
                    </button>
                  </div>
                </div>
                <div
                  v-if="pendingCitationDeleteNumber === citation.number"
                  class="citation-delete-confirm"
                >
                  <span
                    >确认删除未使用的引用 [{{
                      citation.number
                    }}]？编号不会重新排列。</span
                  >
                  <div>
                    <button type="button" @click="cancelCitationDelete">
                      保留
                    </button>
                    <button
                      type="button"
                      class="confirm-delete"
                      @click="confirmCitationDelete(citation.number)"
                    >
                      确认删除
                    </button>
                  </div>
                </div>
              </article>
              <p v-if="!filteredCitations.length" class="citation-empty-search">
                没有符合搜索条件的引用。
              </p>
            </div>
          </div>
          <label v-else class="new-citation-field">
            <span>引用文本</span>
            <textarea
              v-model="newCitationText"
              rows="6"
              maxlength="4000"
              placeholder="直接粘贴期刊或网站提供的 Cite 文本……"
            ></textarea>
            <small
              >将保存为纯文本，不执行 HTML。新编号为 [{{
                nextCitationNumber
              }}]。</small
            >
          </label>
          <p v-if="citationMessage" class="citation-message" aria-live="polite">
            {{ citationMessage }}
          </p>

          <footer>
            <span>快捷键：Ctrl/⌘ + Alt + K</span>
            <button type="button" class="cancel" @click="closeCitationDialog">
              取消
            </button>
            <button
              type="button"
              class="confirm"
              :disabled="!canInsertCitation"
              @click="insertCitation"
            >
              插入 [{{
                citationMode === "new"
                  ? nextCitationNumber
                  : selectedCitationNumber || "—"
              }}]
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="formulaDialogOpen"
        class="formula-dialog-backdrop"
        role="presentation"
        @click.self="closeFormulaDialog"
      >
        <section
          class="formula-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="formula-dialog-title"
        >
          <header>
            <div>
              <h2 id="formula-dialog-title">
                {{ editingFormula ? "编辑公式" : "插入公式" }}
              </h2>
              <p>使用 LaTeX 语法；公式只保存源码，不执行 HTML。</p>
            </div>
            <button
              type="button"
              aria-label="关闭公式窗口"
              @click="closeFormulaDialog"
            >
              ×
            </button>
          </header>

          <div class="formula-mode-actions">
            <button
              type="button"
              :class="{ active: !formulaDisplayMode }"
              :disabled="Boolean(editingFormula)"
              @click="formulaDisplayMode = false"
            >
              行内公式
            </button>
            <button
              type="button"
              :class="{ active: formulaDisplayMode }"
              :disabled="Boolean(editingFormula)"
              @click="formulaDisplayMode = true"
            >
              独立公式块
            </button>
          </div>

          <label class="formula-source-field">
            <span>LaTeX 源码</span>
            <textarea
              v-model="formulaSource"
              rows="6"
              maxlength="4000"
              autofocus
              placeholder="例如：E = mc^2 或 \frac{a}{b}"
            ></textarea>
          </label>

          <div class="formula-preview" :class="{ error: formulaPreview.error }">
            <span>预览</span>
            <div v-if="formulaPreview.html" v-html="formulaPreview.html"></div>
            <p v-else>{{ formulaPreview.error || "输入公式后在这里预览" }}</p>
          </div>

          <footer>
            <span>快捷键：Ctrl/⌘ + Alt + M；双击已有公式可编辑</span>
            <button type="button" class="cancel" @click="closeFormulaDialog">
              取消
            </button>
            <button
              type="button"
              class="confirm"
              :disabled="!formulaSource.trim() || Boolean(formulaPreview.error)"
              @click="saveFormula"
            >
              {{ editingFormula ? "保存" : "插入" }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import ImageCropperDialog from "@/components/ImageCropperDialog.vue";
import "@wangeditor/editor/dist/css/style.css";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";
import { fetchPost } from "@/services/posts";
import { fetchTreeList } from "@/services/trees";
import {
  prepareImageBlob,
  preparedFromDataUrl,
  uploadHtmlDataImages,
  uploadPreparedImage,
} from "@/utils/mediaImages";
import {
  getDraft,
  userDraftOwnerKey,
  visibleDraftOwnerKeys,
} from "@/services/drafts";
import { useDraftAutosave } from "@/composables/useDraftAutosave";
import ColorPaletteInput from "@/components/ColorPaletteInput.vue";
import TaxonomyRankPicker from "@/components/TaxonomyRankPicker.vue";
import MediaImagePicker from "@/components/MediaImagePicker.vue";
import { markdownToSafeHtml } from "@/utils/markdown";
import { renderFormulaNodes, renderLatex } from "@/utils/formula";
import { decorateRichHtml } from "@/utils/richHtml";
import {
  CITATION_MENU_EVENT,
  CITATION_MENU_KEY,
  insertCitationMarker,
  registerCitationMenu,
} from "@/utils/wangEditorCitation";
import {
  IMAGE_CAPTION_TYPE,
  IMAGE_CAPTION_MENU_EVENT,
  IMAGE_CAPTION_MENU_KEY,
  insertImageCaptionBlock,
  registerImageCaptionModule,
  updateImageCaptionBlock,
} from "@/utils/wangEditorImageCaption";
import {
  POST_CARD_CONTENT_EVENT,
  getPostCardIdsInHtml,
  getPostCardNodes,
  insertPostCardBlock,
  migrateLegacyPostCardMarkers,
  registerPostCardModule,
  updatePostCardBlock,
} from "@/utils/wangEditorPostCard";
import {
  FORMULA_BLOCK_TYPE,
  FORMULA_INLINE_TYPE,
  FORMULA_MENU_EVENT,
  FORMULA_MENU_KEY,
  insertOrUpdateFormula,
  registerFormulaModule,
} from "@/utils/wangEditorFormula";
import {
  INSERT_MENU_EVENT,
  INSERT_MENU_KEY,
  registerInsertContentMenu,
} from "@/utils/wangEditorInsertMenu";
import { registerEditorUxModule } from "@/utils/wangEditorUx";
import { normalizeLegacyImageCaptionHtml } from "@/utils/imageCaptionHtml";
import {
  countCitationMarkers,
  normalizeCitationLinks,
} from "@/utils/citationHtml";
import { importDocx } from "@/utils/importExport/docxImport";
import { importMarkdown } from "@/utils/importExport/markdownImport";
import { importHtml } from "@/utils/importExport/htmlImport";
import { exportDocx } from "@/utils/importExport/docxExport";
import {
  exportMarkdown,
  htmlToMarkdownString,
} from "@/utils/importExport/markdownExport";
import { exportHtml } from "@/utils/importExport/htmlExport";
import { pickFile } from "@/utils/importExport";
import { TAXONOMY_RANK_MAP } from "../../shared/taxonomyRanks.js";

registerCitationMenu();
registerImageCaptionModule();
registerPostCardModule();
registerFormulaModule();
registerInsertContentMenu();
registerEditorUxModule();

const emit = defineEmits(["submit"]);
const props = defineProps({
  submitting: { type: Boolean, default: false },
});
const route = useRoute();
const userStore = useUserStore();

const isUiPdfMode = computed(() => true);

const UI_PDF_LAYOUT_KEY = "life-tree-ui-pdf-layout-v1";
const uiPdfTemplates = [
  {
    value: "academic",
    title: "学术报告",
    detail: "衬线正文、清晰层级，适合论文与研究笔记",
  },
  {
    value: "minimal",
    title: "极简文档",
    detail: "大量留白、细线分隔，适合说明和公告",
  },
  {
    value: "magazine",
    title: "杂志图文",
    detail: "紧凑标题和现代字距，适合图文展示",
  },
];
const uiPdfColumnOptions = [
  { value: "single", label: "单栏" },
  { value: "two", label: "双栏" },
  { value: "three", label: "三栏" },
];
const uiPdfDensityOptions = [
  { value: "compact", label: "紧凑" },
  { value: "normal", label: "标准" },
  { value: "relaxed", label: "宽松" },
];
const uiPdfComponents = [
  {
    value: "cover",
    title: "封面页",
    detail: "标题、副标题和分页起点",
  },
  {
    value: "abstract",
    title: "摘要框",
    detail: "摘要与关键词组合块",
  },
  {
    value: "finding",
    title: "关键结论",
    detail: "带强调边线的结论块",
  },
  {
    value: "table",
    title: "数据表",
    detail: "三列表格，可直接改内容",
  },
  {
    value: "figure",
    title: "图注块",
    detail: "图片说明与编号占位",
  },
  {
    value: "source",
    title: "资料来源",
    detail: "置于图或表下方的小字注释",
  },
];

function readUiPdfLayout(key, fallback, allowed) {
  try {
    const source = JSON.parse(localStorage.getItem(UI_PDF_LAYOUT_KEY) || "{}");
    const value = source?.[key];
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

const uiPdfTemplate = ref(
  readUiPdfLayout("template", "academic", ["academic", "minimal", "magazine"]),
);
const uiPdfColumns = ref(
  readUiPdfLayout("columns", "single", ["single", "two", "three"]),
);
const uiPdfDensity = ref(
  readUiPdfLayout("density", "normal", ["compact", "normal", "relaxed"]),
);

const uiPdfPageStyle = computed(() => {
  if (!isUiPdfMode.value) return {};
  const lineHeights = {
    compact: 1.56,
    normal: 1.72,
    relaxed: 1.9,
  };
  return {
    "--ui-pdf-line-height": String(lineHeights[uiPdfDensity.value] || 1.72),
    "--ui-pdf-column-gap": uiPdfColumns.value === "three" ? "22px" : "30px",
  };
});

watch([uiPdfTemplate, uiPdfColumns, uiPdfDensity], (layout) => {
  if (!isUiPdfMode.value) return;
  localStorage.setItem(
    UI_PDF_LAYOUT_KEY,
    JSON.stringify({
      template: layout[0],
      columns: layout[1],
      density: layout[2],
    }),
  );
});

function insertUiPdfPageBreak() {
  const editor = editorRef.value;
  const marker = "<hr />";
  if (typeof editor?.dangerouslyInsertHtml === "function") {
    editor.focus();
    editor.dangerouslyInsertHtml(marker);
    content.value = editor.getHtml();
  } else {
    content.value += marker;
  }
  imageMessage.value = "已插入分页标记。";
  setTimeout(() => (imageMessage.value = ""), 2600);
  closeInsertPanel();
}

function insertUiPdfComponent(componentType) {
  const components = {
    cover:
      '<h1>文档标题</h1><p>副标题 / 作者</p><hr class="ui-pdf-page-break" />',
    abstract:
      "<blockquote><p><strong>摘要：</strong>在这里写一段摘要。</p><p><strong>关键词：</strong>关键词一；关键词二</p></blockquote>",
    finding:
      "<blockquote><p><strong>关键结论：</strong>在这里写最重要的研究发现。</p></blockquote>",
    table:
      "<table><thead><tr><th>指标</th><th>数值</th><th>说明</th></tr></thead><tbody><tr><td>示例指标</td><td>0.00</td><td>双击单元格后直接编辑</td></tr></tbody></table>",
    figure:
      '<p><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjQwMCIgeT0iMjI1IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5Zu+54mH5Y2g5L2NPC90ZXh0Pjwvc3ZnPg==" alt="图片占位" /></p><p>图 1：图片说明</p>',
    source: "<p>资料来源：在这里补充来源信息。</p>",
  };
  const marker = components[componentType];
  if (!marker) return;
  const editor = editorRef.value;
  if (typeof editor?.dangerouslyInsertHtml === "function") {
    editor.focus();
    editor.dangerouslyInsertHtml(marker);
    content.value = editor.getHtml();
  } else {
    content.value += marker;
  }
  imageMessage.value = "已插入 PDF 排版组件。";
  setTimeout(() => (imageMessage.value = ""), 2600);
  closeInsertPanel();
}

const editorRef = shallowRef();
const title = ref("");
const author = ref("");
const content = ref("");
// Markdown 编辑模式
const editMode = ref("rich"); // 'rich' | 'markdown'
const markdownEditorSource = ref("");
const markdownEditorTab = ref("code"); // 'code' | 'preview'
const markdownEditorPreview = ref("");
let markdownSyncTimer = null;
const tagInput = ref("");
const tags = ref([]);
const license = ref("支持闭源");
const changeNote = ref("");
const agreementAccepted = ref(false);
const errorMessage = ref("");
const viewCount = 0;
const submittedAt = ref("");
const isMinorChange = ref(false);
const editingPost = ref(null);
const currentDraftOwnerKey = ref("");
const researchTrees = ref([]);
const selectedTreeId = ref("");
const treeListMessage = ref("");
const imageMessage = ref("");
const uploadingImages = ref(false);
const coverInput = ref(null);
const coverCropper = ref(null);
const coverPreview = ref("");
const coverPrepared = shallowRef(null);
const coverRemoved = ref(false);
const pendingCoverHash = ref("");
const markdownSource = ref("");
const markdownPreview = ref("");
const markdownMessage = ref("");
const markdownTab = ref("code");
let markdownPreviewTimer = null;
const mediaPickerOpen = ref(false);
const mediaPickerTarget = ref("");
const mediaPickerCardId = ref("");
const mediaPickerInitialDescription = ref("");
const citations = ref([]);
const citationPanelCollapsed = ref(false);
const importMenuOpen = ref(false);
const exportMenuOpen = ref(false);
const importExportMessage = ref("");
const importExportLoading = ref(false);
const citationDialogOpen = ref(false);
const citationMode = ref("new");
const selectedCitationNumber = ref(null);
const newCitationText = ref("");
const citationSearchQuery = ref("");
const editingCitationNumber = ref(null);
const editingCitationText = ref("");
const pendingCitationDeleteNumber = ref(null);
const citationMessage = ref("");
const formulaDialogOpen = ref(false);
const formulaSource = ref("");
const formulaDisplayMode = ref(false);
const editingFormula = shallowRef(null);
const imageDialogOpen = ref(false);
const imageDialogDescription = ref("");
const imageDialogPreview = ref("");
const pendingContentImage = shallowRef(null);
const editingImageNode = shallowRef(null);
const insertPanelOpen = ref(false);
const insertPanelSection = ref("menu");
const floatingToolbarsEnabled = ref(true);
const insertToolbarVisible = ref(false);
const insertToolbarRef = ref(null);
const inlineImageInput = ref(null);
const insertToolbarPosition = ref({ left: 0, top: 0 });
const uiPdfPrintOpen = ref(false);
const insertToolbarStyle = computed(() => ({
  left: `${insertToolbarPosition.value.left}px`,
  top: `${insertToolbarPosition.value.top}px`,
}));
const pdfPrintCards = computed(() =>
  sidebarCards.value.filter(
    (card) =>
      card.placements.includes("outline") && !card.placements.includes("body"),
  ),
);
const mediaPickerDescriptionLabel = computed(() =>
  mediaPickerTarget.value === "card"
    ? "卡片图片说明"
    : mediaPickerTarget.value === "cover"
      ? "封面说明"
      : "正文图片注释",
);
const sortedCitations = computed(() =>
  [...citations.value].sort((first, second) => first.number - second.number),
);
const citationMarkerCounts = computed(() =>
  countCitationMarkers(content.value),
);
const filteredCitations = computed(() => {
  const keyword = citationSearchQuery.value.trim().toLowerCase();
  if (!keyword) return sortedCitations.value;
  return sortedCitations.value.filter((citation) =>
    `[${citation.number}] ${citation.text}`.toLowerCase().includes(keyword),
  );
});
const nextCitationNumber = computed(
  () =>
    Math.max(
      0,
      ...citations.value.map((citation) => Number(citation.number) || 0),
    ) + 1,
);
const canInsertCitation = computed(() =>
  citationMode.value === "new"
    ? Boolean(newCitationText.value.trim()) &&
      citations.value.length < 200 &&
      nextCitationNumber.value <= 9_999
    : editingCitationNumber.value === null &&
      pendingCitationDeleteNumber.value === null &&
      citations.value.some(
        (citation) => citation.number === selectedCitationNumber.value,
      ),
);
watch(filteredCitations, (visible) => {
  if (citationMode.value !== "existing") return;
  if (
    visible.some((citation) => citation.number === selectedCitationNumber.value)
  )
    return;
  selectedCitationNumber.value = visible[0]?.number || null;
});
const formulaPreview = computed(() => {
  const latex = formulaSource.value.trim();
  if (!latex) return { html: "", error: "" };
  try {
    return {
      html: renderLatex(latex, formulaDisplayMode.value, {
        throwOnError: true,
      }),
      error: "",
    };
  } catch (error) {
    return {
      html: "",
      error: String(error?.message || "公式语法有误").replace(
        /^KaTeX parse error:\s*/i,
        "",
      ),
    };
  }
});
const insertPanelTitle = computed(
  () =>
    ({
      menu: "插入内容",
      sidebar: "文章卡片",
      tree: "插入 Research 进化树块",
      markdown: "从 Markdown 导入正文",
    })[insertPanelSection.value] || "插入内容",
);
let sidebarCardSeed = 0;
let sidebarRowSeed = 0;
const createSidebarRow = (source = {}, type = "taxonomy") => ({
  id: `sidebar-row-${(sidebarRowSeed += 1)}`,
  ...(type === "taxonomy"
    ? { rankKey: source.rankKey || "", value: source.value || "" }
    : { label: source.label || "", value: source.value || "" }),
});
const defaultTaxonomyRows = () =>
  [
    "domain",
    "kingdom",
    "phylum",
    "class",
    "order",
    "family",
    "genus",
    "species",
  ].map((rankKey) => createSidebarRow({ rankKey }, "taxonomy"));
const createSidebarCard = (type = "taxonomy", source = {}) => ({
  id: /^[A-Za-z0-9_-]{1,80}$/.test(String(source.id || ""))
    ? String(source.id)
    : `sidebar-card-${(sidebarCardSeed += 1)}`,
  type,
  placements: (() => {
    const placements = Array.isArray(source.placements)
      ? [
          ...new Set(
            source.placements.filter((item) =>
              ["body", "outline"].includes(item),
            ),
          ),
        ]
      : ["outline"];
    return placements.length ? placements : ["outline"];
  })(),
  title: source.title || (type === "taxonomy" ? "科学分类" : "自定义卡片"),
  color: source.color || "#eadf77",
  imageHash: source.imageHash || "",
  imagePreview:
    source.imageDataUrl ||
    source.imageUrl ||
    (source.imageHash ? `/media/${source.imageHash}` : ""),
  imageCaption: source.imageCaption || "",
  pendingImage: null,
  rows:
    Array.isArray(source.rows) && source.rows.length
      ? source.rows.map((row) => createSidebarRow(row, type))
      : type === "taxonomy"
        ? defaultTaxonomyRows()
        : [createSidebarRow({}, "custom"), createSidebarRow({}, "custom")],
});
const sidebarCards = ref([]);

const creator = computed(() => userStore.user?.name || "未注册用户");
const editId = computed(() => String(route.query.edit || ""));
const draftQueryId = computed(() => String(route.query.draft || ""));
const isEditing = computed(() => Boolean(editId.value));
const isPrivateWork = computed(
  () => editingPost.value?.visibility === "PRIVATE",
);
const submissionTime = computed(() =>
  submittedAt.value ? formatDateTime(submittedAt.value) : "提交时生成",
);

const articleDraftSource = computed(() => ({
  title: title.value,
  author: author.value,
  content: content.value,
  tags: tags.value,
  citations: citations.value,
  license: license.value,
  changeNote: changeNote.value,
  isMinorChange: isMinorChange.value,
  coverPreview: coverPreview.value,
  coverDataUrl: coverPrepared.value?.dataUrl || "",
  coverRemoved: coverRemoved.value,
  pendingCoverHash: pendingCoverHash.value,
  cards: sidebarCardsPayload({ draft: true }),
  markdownSource: markdownSource.value,
}));

async function buildArticleDraft(id) {
  return {
    id,
    ownerKey: currentDraftOwnerKey.value || userDraftOwnerKey(userStore.user),
    contentType: "ARTICLE",
    mode: isEditing.value ? "EDIT" : "CREATE",
    title: title.value || "未命名文章草稿",
    targetId: editId.value,
    baseVersion: Number(editingPost.value?.version || 0),
    payload: {
      title: title.value,
      author: author.value,
      content: content.value,
      tags: [...tags.value],
      citations: sortedCitations.value.map((citation) => ({ ...citation })),
      license: license.value,
      changeNote: changeNote.value,
      submittedAt: submittedAt.value,
      isMinorChange: isMinorChange.value,
      coverPreview: coverPreview.value,
      coverDataUrl: coverPrepared.value?.dataUrl || "",
      coverRemoved: coverRemoved.value,
      pendingCoverHash: pendingCoverHash.value,
      cards: sidebarCardsPayload({ draft: true }),
      markdownSource: markdownSource.value,
    },
  };
}

const draftAutosave = useDraftAutosave({
  source: () => articleDraftSource.value,
  buildDraft: buildArticleDraft,
});

const draftStatusText = computed(() => {
  if (draftAutosave.errorMessage.value) return draftAutosave.errorMessage.value;
  if (draftAutosave.status.value === "saving") return "正在保存草稿……";
  if (draftAutosave.isDirty.value) {
    return draftAutosave.saveMode.value === "auto"
      ? "内容已修改，等待自动保存"
      : "有未保存修改；点击“保存草稿”或按 Ctrl/⌘ + S";
  }
  if (draftAutosave.lastSavedAt.value) {
    return `草稿已保存：${formatDateTime(draftAutosave.lastSavedAt.value)}`;
  }
  return draftAutosave.saveMode.value === "auto"
    ? "未修改；修改后会自动保存到此设备"
    : "未修改；当前使用手动保存";
});

const toolbarConfig = {
  toolbarKeys: [
    "headerSelect",
    "bold",
    "italic",
    "underline",
    "through",
    "color",
    "bgColor",
    "bulletedList",
    "numberedList",
    "todo",
    "blockquote",
    "codeBlock",
    "codeSelectLang",
    "insertLink",
    "uploadImage",
    INSERT_MENU_KEY,
    CITATION_MENU_KEY,
    FORMULA_MENU_KEY,
    "undo",
    "redo",
  ],
};

const toolbarTooltipDefinitions = {
  headerSelect: { label: "正文与标题" },
  bold: { label: "加粗", shortcut: "mod+B" },
  italic: { label: "斜体", shortcut: "mod+I" },
  underline: { label: "下划线", shortcut: "mod+U" },
  through: { label: "删除线", shortcut: "mod+Shift+X" },
  color: { label: "文字颜色" },
  bgColor: { label: "背景色" },
  clearStyle: { label: "清除格式" },
  bulletedList: { label: "无序列表" },
  numberedList: { label: "有序列表" },
  todo: { label: "待办事项" },
  blockquote: { label: "引用" },
  codeBlock: { label: "代码块" },
  codeSelectLang: { label: "代码语言" },
  insertLink: { label: "插入链接" },
  uploadImage: { label: "上传图片" },
  [INSERT_MENU_KEY]: { label: "插入内容", shortcut: "mod+Shift+I" },
  [CITATION_MENU_KEY]: { label: "插入正文引用", shortcut: "mod+Alt+K" },
  [FORMULA_MENU_KEY]: { label: "插入数学公式", shortcut: "mod+Alt+M" },
  undo: { label: "撤销", shortcut: "mod+Z" },
  redo: { label: "重做", shortcut: "redo" },
};

const editorConfig = {
  placeholder: "请输入文章内容，可以选择文字后设置颜色……",
  hoverbarKeys: {
    text: {
      menuKeys: [
        "headerSelect",
        "insertLink",
        "bulletedList",
        "numberedList",
        "todo",
        "|",
        "bold",
        "italic",
        "underline",
        "through",
        "color",
        "bgColor",
        "clearStyle",
        "|",
        "blockquote",
        "codeBlock",
      ],
    },
    [FORMULA_INLINE_TYPE]: {
      menuKeys: [FORMULA_MENU_KEY],
    },
    [FORMULA_BLOCK_TYPE]: {
      menuKeys: [FORMULA_MENU_KEY],
    },
    [IMAGE_CAPTION_TYPE]: {
      menuKeys: [IMAGE_CAPTION_MENU_KEY],
    },
  },
  MENU_CONF: {
    uploadImage: {
      maxFileSize: 25 * 1024 * 1024,
      allowedFileTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      customUpload: handleLocalImage,
    },
  },
};

const plainContent = computed(() =>
  content.value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim(),
);

const canSubmit = computed(
  () =>
    !props.submitting &&
    !uploadingImages.value &&
    title.value.trim() &&
    plainContent.value &&
    agreementAccepted.value,
);
const canSavePrivate = computed(
  () => !props.submitting && !uploadingImages.value,
);
const submitting = computed(() => props.submitting);
const editorWrapperRef = ref(null);

function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  const platform =
    navigator.userAgentData?.platform || navigator.platform || "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

function formatToolbarShortcut(shortcut) {
  if (!shortcut) return "";
  const apple = isApplePlatform();
  if (shortcut === "redo") {
    return apple ? "⌘ + Shift + Z" : "Ctrl + Y / Ctrl + Shift + Z";
  }
  return shortcut
    .replace(/^mod/i, apple ? "⌘" : "Ctrl")
    .split("+")
    .join(" + ");
}

function applyToolbarShortcutTooltips() {
  const wrapper = editorWrapperRef.value;
  if (!wrapper) return;
  wrapper.querySelectorAll("[data-menu-key]").forEach((button) => {
    const key = button.getAttribute("data-menu-key");
    const definition = toolbarTooltipDefinitions[key];
    if (!definition) return;
    const shortcut = formatToolbarShortcut(definition.shortcut);
    const tooltip = shortcut
      ? `${definition.label}\n${shortcut}`
      : definition.label;
    button.setAttribute("data-tooltip", tooltip);
    button.setAttribute(
      "aria-label",
      shortcut ? `${definition.label}，快捷键 ${shortcut}` : definition.label,
    );
    button.classList.add("w-e-menu-tooltip-v5");
  });
}

function hasOpenEditorDialog() {
  return (
    insertPanelOpen.value ||
    citationDialogOpen.value ||
    formulaDialogOpen.value ||
    imageDialogOpen.value ||
    mediaPickerOpen.value
  );
}

function getEditableElement() {
  return editorWrapperRef.value?.querySelector("[data-slate-editor]");
}

function getCaretRect(range) {
  const rangeRect = range.getBoundingClientRect();
  if (rangeRect.width || rangeRect.height) return rangeRect;
  const clientRect = range.getClientRects()[0];
  if (clientRect) return clientRect;
  const anchorElement =
    range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer
      : range.startContainer.parentElement;
  return anchorElement?.getBoundingClientRect() || null;
}

async function updateInsertToolbarPosition(force = false) {
  if (!floatingToolbarsEnabled.value || hasOpenEditorDialog()) {
    insertToolbarVisible.value = false;
    return;
  }
  const editable = getEditableElement();
  const selection = window.getSelection();
  if (
    !editable ||
    !selection?.rangeCount ||
    !selection.isCollapsed ||
    !editable.contains(selection.anchorNode)
  ) {
    insertToolbarVisible.value = false;
    return;
  }
  const range = selection.getRangeAt(0);
  const caretRect = getCaretRect(range);
  if (!caretRect || (!force && caretRect.bottom < 0)) {
    insertToolbarVisible.value = false;
    return;
  }
  insertToolbarVisible.value = true;
  await nextTick();
  const toolbar = insertToolbarRef.value;
  if (!toolbar || !insertToolbarVisible.value) return;
  const toolbarRect = toolbar.getBoundingClientRect();
  const viewportPadding = 8;
  const desiredLeft = caretRect.left - toolbarRect.width / 2;
  const maxLeft = Math.max(
    viewportPadding,
    window.innerWidth - toolbarRect.width - viewportPadding,
  );
  const left = Math.min(Math.max(desiredLeft, viewportPadding), maxLeft);
  const below = caretRect.bottom + 10;
  const above = caretRect.top - toolbarRect.height - 10;
  const top =
    below + toolbarRect.height <= window.innerHeight - viewportPadding
      ? below
      : Math.max(viewportPadding, above);
  insertToolbarPosition.value = { left, top };
}

function handleEditorSelectionChange() {
  window.requestAnimationFrame(() => updateInsertToolbarPosition());
}

function handleEditorShortcut(event) {
  const editable = getEditableElement();
  if (
    !editable ||
    !editable.contains(document.activeElement) ||
    !(event.ctrlKey || event.metaKey) ||
    !event.shiftKey ||
    event.key.toLowerCase() !== "i"
  )
    return;
  event.preventDefault();
  updateInsertToolbarPosition(true);
}

function toggleFloatingToolbars() {
  floatingToolbarsEnabled.value = !floatingToolbarsEnabled.value;
  window.localStorage.setItem(
    "life-editor-floating-tools",
    floatingToolbarsEnabled.value ? "on" : "off",
  );
  if (!floatingToolbarsEnabled.value) {
    insertToolbarVisible.value = false;
    editorRef.value?.hidePanelOrModal();
    return;
  }
  nextTick(() => updateInsertToolbarPosition(true));
}

function hideInsertToolbar() {
  insertToolbarVisible.value = false;
}

function chooseInlineImage() {
  hideInsertToolbar();
  inlineImageInput.value?.click();
}

async function handleInlineImageChange(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    await handleLocalImage(file);
  } catch {
    // handleLocalImage 已经把可读错误写入 imageMessage。
  }
}

async function openInlineMediaLibrary() {
  hideInsertToolbar();
  await openMediaPicker("content");
}

function openInlineCitation() {
  hideInsertToolbar();
  openCitationDialog({ detail: { editor: editorRef.value } });
}

function openInlineFormula() {
  hideInsertToolbar();
  openFormulaDialog({ detail: { editor: editorRef.value } });
}

function openInsertToolSection(section) {
  hideInsertToolbar();
  insertPanelSection.value = section;
  insertPanelOpen.value = true;
}

let toolbarObserver;

async function handleCreated(editor) {
  editorRef.value = editor;
  await nextTick();
  applyToolbarShortcutTooltips();
  toolbarObserver = new MutationObserver(applyToolbarShortcutTooltips);
  toolbarObserver.observe(editorWrapperRef.value, {
    childList: true,
    subtree: true,
  });
  if (content.value) {
    editor.setHtml(
      normalizeCitationLinks(
        migrateLegacyPostCardMarkers(
          normalizeLegacyImageCaptionHtml(content.value),
          sidebarCards.value,
        ),
        citations.value,
      ),
    );
  }
}

function openCitationDialog(event) {
  if (event?.detail?.editor !== editorRef.value) return;
  citationMode.value = citations.value.length ? "existing" : "new";
  selectedCitationNumber.value = sortedCitations.value[0]?.number || null;
  newCitationText.value = "";
  citationSearchQuery.value = "";
  editingCitationNumber.value = null;
  editingCitationText.value = "";
  pendingCitationDeleteNumber.value = null;
  citationMessage.value = "";
  citationDialogOpen.value = true;
}

function closeCitationDialog() {
  citationDialogOpen.value = false;
  editingCitationNumber.value = null;
  editingCitationText.value = "";
  pendingCitationDeleteNumber.value = null;
  citationMessage.value = "";
}

function citationUsageCount(number) {
  return citationMarkerCounts.value.get(Number(number)) || 0;
}

function selectCitation(number) {
  selectedCitationNumber.value = number;
  pendingCitationDeleteNumber.value = null;
  citationMessage.value = "";
}

function changeCitationMode(mode) {
  citationMode.value = mode;
  editingCitationNumber.value = null;
  editingCitationText.value = "";
  pendingCitationDeleteNumber.value = null;
  citationMessage.value = "";
}

function startEditingCitation(citation) {
  editingCitationNumber.value = citation.number;
  editingCitationText.value = citation.text;
  pendingCitationDeleteNumber.value = null;
  citationMessage.value = "";
}

function cancelEditingCitation() {
  editingCitationNumber.value = null;
  editingCitationText.value = "";
}

function saveCitationText() {
  const number = Number(editingCitationNumber.value);
  const text = editingCitationText.value.trim().slice(0, 4000);
  if (!number || !text) return;
  citations.value = citations.value.map((citation) =>
    citation.number === number ? { ...citation, text } : citation,
  );
  editingCitationNumber.value = null;
  editingCitationText.value = "";
  citationMessage.value = `引用 [${number}] 的文字已更新，正文编号保持不变。`;
}

function requestCitationDelete(citation) {
  const usageCount = citationUsageCount(citation.number);
  editingCitationNumber.value = null;
  editingCitationText.value = "";
  if (usageCount > 0) {
    pendingCitationDeleteNumber.value = null;
    citationMessage.value = `引用 [${citation.number}] 仍在正文中使用 ${usageCount} 次，请先删除对应的蓝色上标。`;
    return;
  }
  pendingCitationDeleteNumber.value = citation.number;
  citationMessage.value = `引用 [${citation.number}] 未被正文使用，可以安全删除。`;
}

function cancelCitationDelete() {
  pendingCitationDeleteNumber.value = null;
  citationMessage.value = "";
}

function confirmCitationDelete(number) {
  const citationNumber = Number(number);
  const usageCount = citationUsageCount(citationNumber);
  if (!citationNumber || usageCount > 0) {
    pendingCitationDeleteNumber.value = null;
    citationMessage.value = `引用 [${citationNumber}] 又被正文使用，已取消删除。`;
    return;
  }
  citations.value = citations.value.filter(
    (citation) => citation.number !== citationNumber,
  );
  if (selectedCitationNumber.value === citationNumber) {
    selectedCitationNumber.value = sortedCitations.value[0]?.number || null;
  }
  pendingCitationDeleteNumber.value = null;
  citationMessage.value = `未使用的引用 [${citationNumber}] 已删除；其他引用编号没有变化。`;
  if (!citations.value.length) citationMode.value = "new";
}

function insertCitation() {
  if (!canInsertCitation.value) return;
  let number = selectedCitationNumber.value;
  if (citationMode.value === "new") {
    number = nextCitationNumber.value;
    citations.value.push({
      number,
      text: newCitationText.value.trim().slice(0, 4000),
    });
  }
  const editor = editorRef.value;
  if (!editor || !number) return;
  editor.focus();
  insertCitationMarker(editor, number);
  content.value = editor.getHtml();
  citationDialogOpen.value = false;
}

function quickAddCitation() {
  const number = nextCitationNumber.value;
  const text = window.prompt(
    `添加新引用 [${number}]：\n粘贴引用文本（期刊、书籍、DOI等）`,
  );
  if (!text?.trim()) return;
  citations.value.push({
    number,
    text: text.trim().slice(0, 4000),
  });
  citationMessage.value = `已添加引用 [${number}]，点击"插入"按钮可添加到正文。`;
}

function toggleCitationEdit(citation) {
  if (editingCitationNumber.value === citation.number) {
    editingCitationNumber.value = null;
    editingCitationText.value = "";
  } else {
    editingCitationNumber.value = citation.number;
    editingCitationText.value = citation.text;
  }
}

function quickDeleteCitation(citation) {
  const usageCount = citationUsageCount(citation.number);
  if (usageCount > 0) {
    citationMessage.value = `引用 [${citation.number}] 仍在正文中使用 ${usageCount} 次，请先删除对应的蓝色上标。`;
    return;
  }
  const confirmed = window.confirm(
    `确认删除引用 [${citation.number}]？\n编号不会重新排列。`,
  );
  if (!confirmed) return;
  citations.value = citations.value.filter((c) => c.number !== citation.number);
  citationMessage.value = `引用 [${citation.number}] 已删除。`;
  if (editingCitationNumber.value === citation.number) {
    editingCitationNumber.value = null;
    editingCitationText.value = "";
  }
  if (selectedCitationNumber.value === citation.number) {
    selectedCitationNumber.value = sortedCitations.value[0]?.number || null;
  }
  if (!citations.value.length) citationMode.value = "new";
}

function insertCitationNumber(number) {
  const citationNumber = Number(number);
  if (!citationNumber) return;
  const editor = editorRef.value;
  if (!editor) return;
  editor.focus();
  insertCitationMarker(editor, citationNumber);
  content.value = editor.getHtml();
  citationMessage.value = `已插入引用 [${citationNumber}] 到光标位置。`;
}

function openFormulaDialog(event) {
  if (event?.detail?.editor !== editorRef.value) return;
  const formula = event.detail.formula || null;
  editingFormula.value = formula;
  formulaSource.value = String(formula?.latex || "");
  formulaDisplayMode.value = formula?.type === FORMULA_BLOCK_TYPE;
  formulaDialogOpen.value = true;
}

function closeFormulaDialog() {
  formulaDialogOpen.value = false;
  editingFormula.value = null;
}

function saveFormula() {
  if (!formulaSource.value.trim() || formulaPreview.value.error) return;
  const editor = editorRef.value;
  if (!editor) return;
  editor.focus();
  const saved = insertOrUpdateFormula(editor, {
    latex: formulaSource.value,
    displayMode: formulaDisplayMode.value,
    existing: editingFormula.value,
  });
  if (!saved) return;
  content.value = editor.getHtml();
  closeFormulaDialog();
}

function openInsertPanel(event) {
  if (event?.detail?.editor !== editorRef.value) return;
  insertPanelSection.value = "menu";
  insertPanelOpen.value = true;
}

function closeInsertPanel() {
  insertPanelOpen.value = false;
  insertPanelSection.value = "menu";
}

function showInsertPanelSection(section) {
  insertPanelSection.value = section;
}

async function openContentMediaLibrary() {
  closeInsertPanel();
  await nextTick();
  await openMediaPicker("content");
}

function insertHtmlAtCursor(html) {
  const editor = editorRef.value;
  if (typeof editor?.dangerouslyInsertHtml === "function") {
    editor.focus();
    editor.dangerouslyInsertHtml(html);
    content.value = editor.getHtml();
  } else {
    content.value += html;
  }
}

function normalizedEditorCard(card) {
  return {
    id: card.id,
    type: card.type,
    title: card.title,
    color: card.color,
    imageSrc: card.imagePreview || card.imageUrl || "",
    imageCaption: card.imageCaption,
    rows: card.rows,
  };
}

function syncSidebarCardsFromEditor() {
  const editor = editorRef.value;
  if (!editor) return;
  const editorCards = new Map(
    getPostCardNodes(editor).map((node) => [node.id, node]),
  );
  sidebarCards.value = sidebarCards.value.map((card) => {
    const source = editorCards.get(card.id);
    if (!source) return card;
    if (source.imageSrc) card.imagePreview = source.imageSrc;
    return {
      ...card,
      title: source.title,
      color: source.color,
      imageSrc: source.imageSrc,
      imageCaption: source.imageCaption,
      rows: source.rows.map((row, index) => ({
        ...(card.rows[index] || { id: `${card.id}-row-${index + 1}` }),
        ...row,
      })),
    };
  });
}

function bodyCardMarkerIds(html = content.value) {
  return getPostCardIdsInHtml(html);
}

function reconcileCardPlacements(cards, html = content.value) {
  const markerIds = bodyCardMarkerIds(html);
  for (const card of cards) {
    const placements = new Set(card.placements);
    if (markerIds.has(card.id)) placements.add("body");
    else placements.delete("body");
    if (!placements.size) placements.add("outline");
    card.placements = [...placements];
  }
  return cards;
}

function removeBodyCardMarker(html, cardId) {
  const source = String(html || "");
  if (typeof DOMParser === "undefined") {
    const escapedId = String(cardId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return source.replace(
      new RegExp(
        `<p[^>]*>\\s*<a[^>]*href=["']#post-card-${escapedId}["'][^>]*>[\\s\\S]*?<\\/a>\\s*<\\/p>`,
        "gi",
      ),
      "",
    );
  }
  const parsed = new DOMParser().parseFromString(
    `<body>${source}</body>`,
    "text/html",
  );
  for (const anchor of parsed.body.querySelectorAll("a")) {
    if (anchor.getAttribute("href") !== `#post-card-${cardId}`) continue;
    const parent = anchor.parentElement;
    if (parent?.tagName === "P" && parent.children.length === 1)
      parent.remove();
    else anchor.remove();
  }
  return parsed.body.innerHTML;
}

function replaceEditorContent(nextContent) {
  content.value = nextContent;
  if (editorRef.value?.getHtml?.() !== nextContent) {
    editorRef.value?.setHtml?.(nextContent);
  }
}

function insertBodyCardMarker(card) {
  if (bodyCardMarkerIds().has(card.id)) return;
  const editor = editorRef.value;
  if (!editor) return;
  if (insertPostCardBlock(editor, normalizedEditorCard(card))) {
    const html = editor.getHtml();
    if (html && html !== content.value) content.value = html;
  }
}

function insertCardIntoEditor(type = "taxonomy") {
  const card = createSidebarCard(type);
  card.placements = ["body"];
  sidebarCards.value = [...sidebarCards.value, card];
  const editor = editorRef.value;
  if (!editor) return;
  if (insertPostCardBlock(editor, normalizedEditorCard(card))) {
    const html = editor.getHtml();
    if (html && html !== content.value) content.value = html;
  }
}

function toggleCardPlacement(card, placement, checked) {
  const placements = new Set(card.placements);
  if (checked) placements.add(placement);
  else if (placements.size > 1) placements.delete(placement);
  card.placements = [...placements];
  if (placement !== "body") return;
  if (checked) {
    insertBodyCardMarker(card);
  } else {
    replaceEditorContent(removeBodyCardMarker(content.value, card.id));
  }
}

watch(content, (html) => {
  reconcileCardPlacements(sidebarCards.value, html);
});

watch(
  sidebarCards,
  (cards) => {
    const editor = editorRef.value;
    if (!editor) return;
    const bodyIds = getPostCardIdsInHtml(editor.getHtml());
    cards
      .filter((card) => bodyIds.has(card.id))
      .forEach((card) =>
        updatePostCardBlock(editor, normalizedEditorCard(card)),
      );
  },
  { deep: true },
);

function renderMarkdownPreview() {
  try {
    markdownPreview.value = decorateRichHtml(
      renderFormulaNodes(markdownToSafeHtml(markdownSource.value)),
    );
    markdownMessage.value = "";
  } catch (error) {
    markdownPreview.value = "";
    markdownMessage.value = error.message || "Markdown 解析失败";
  }
}

function previewMarkdown() {
  renderMarkdownPreview();
  markdownMessage.value = "预览已按文章安全规则生成。";
}

function switchMarkdownTab(tab) {
  markdownTab.value = tab;
  if (tab === "preview") renderMarkdownPreview();
}

// 切到预览标签时实时渲染（防抖），代码标签下不做无效计算
watch(markdownSource, () => {
  if (markdownTab.value !== "preview") return;
  if (markdownPreviewTimer) clearTimeout(markdownPreviewTimer);
  markdownPreviewTimer = setTimeout(renderMarkdownPreview, 200);
});

function insertMarkdown() {
  let html;
  try {
    html = markdownToSafeHtml(markdownSource.value);
  } catch (error) {
    markdownMessage.value = error.message || "Markdown 解析失败";
    return;
  }
  if (!html.trim()) {
    markdownMessage.value = "没有可插入的 Markdown 内容。";
    return;
  }
  insertHtmlAtCursor(`${html}<p><br></p>`);
  markdownMessage.value = "Markdown 已插入到正文。";
  markdownPreview.value = decorateRichHtml(renderFormulaNodes(html));
  closeInsertPanel();
}

// ============ Markdown 编辑模式 ============

function renderMarkdownEditorPreview() {
  try {
    markdownEditorPreview.value = decorateRichHtml(
      renderFormulaNodes(markdownToSafeHtml(markdownEditorSource.value)),
    );
  } catch (error) {
    markdownEditorPreview.value = `<p style="color:#dc2626">${error.message || "Markdown 解析失败"}</p>`;
  }
}

function syncMarkdownToHtml() {
  if (markdownSyncTimer) clearTimeout(markdownSyncTimer);
  markdownSyncTimer = setTimeout(() => {
    try {
      content.value = markdownToSafeHtml(markdownEditorSource.value);
    } catch {
      /* 忽略，预览区会显示错误 */
    }
  }, 300);
}

async function switchToMarkdownMode() {
  try {
    markdownEditorSource.value = await htmlToMarkdownString(content.value);
  } catch {
    markdownEditorSource.value = "";
  }
  markdownEditorTab.value = "code";
  editMode.value = "markdown";
  nextTick(() => renderMarkdownEditorPreview());
}

function switchToRichMode() {
  if (markdownSyncTimer) clearTimeout(markdownSyncTimer);
  try {
    content.value = markdownToSafeHtml(markdownEditorSource.value);
  } catch {
    /* 保留已有 content */
  }
  editMode.value = "rich";
  nextTick(() => {
    if (editorRef.value) editorRef.value.setHtml(content.value);
  });
}

function switchMarkdownEditorTab(tab) {
  markdownEditorTab.value = tab;
  if (tab === "preview") renderMarkdownEditorPreview();
}

watch(markdownEditorSource, () => {
  syncMarkdownToHtml();
  if (markdownEditorTab.value === "preview") renderMarkdownEditorPreview();
});

async function openMediaPicker(target, card = null) {
  await userStore.initialize();
  if (!userStore.isLoggedIn) {
    window.alert(
      "图片库属于个人账号，请先登录；未登录时仍可继续使用本地图片制作草稿。",
    );
    return;
  }
  mediaPickerTarget.value = target;
  mediaPickerCardId.value = card?.id || "";
  mediaPickerInitialDescription.value = card?.imageCaption || "";
  mediaPickerOpen.value = true;
}

function closeMediaPicker() {
  mediaPickerOpen.value = false;
}

function useLibraryImage({ image, description }) {
  if (!image?.hash || !image?.url) return;
  if (mediaPickerTarget.value === "cover") {
    coverPrepared.value = null;
    coverPreview.value = image.url;
    pendingCoverHash.value = image.hash;
    coverRemoved.value = false;
    imageMessage.value = "已从个人图片库选择文章封面。";
  } else if (mediaPickerTarget.value === "card") {
    const card = sidebarCards.value.find(
      (item) => item.id === mediaPickerCardId.value,
    );
    if (!card) return;
    card.pendingImage = null;
    card.imagePreview = image.url;
    card.imageHash = image.hash;
    card.imageCaption = description.slice(0, 120);
    imageMessage.value = "已从个人图片库选择卡片图片。";
  } else {
    const inserted = insertImageCaptionBlock(editorRef.value, {
      src: image.url,
      caption: description,
      alt: description,
    });
    if (!inserted) {
      imageMessage.value = "图片未能插入，请先点击正文中的插入位置后重试。";
      closeMediaPicker();
      return;
    }
    content.value = editorRef.value?.getHtml() || content.value;
    imageMessage.value = "已插入由图片和注释组成的完整图片块。";
  }
  closeMediaPicker();
}

// 导入/导出功能
async function handleImport(format) {
  importMenuOpen.value = false;
  if (importExportLoading.value) return;

  const acceptMap = {
    docx: ".docx",
    md: ".md,.markdown,.txt",
    html: ".html,.htm",
  };

  try {
    const file = await pickFile(acceptMap[format] || "*");
    if (!file) return;

    importExportLoading.value = true;
    importExportMessage.value = `正在导入${format === "docx" ? "Word 文档" : format === "md" ? "Markdown" : "富文本"}……`;

    let html;
    if (format === "docx") {
      html = await importDocx(file);
    } else if (format === "md") {
      html = await importMarkdown(file);
    } else {
      html = await importHtml(file);
    }

    // 规范化引用链接
    html = normalizeCitationLinks(html, citations.value);

    const editor = editorRef.value;
    if (editor) {
      editor.setHtml(html);
      content.value = editor.getHtml();
    } else {
      content.value = html;
    }

    importExportMessage.value = "导入成功";
    setTimeout(() => (importExportMessage.value = ""), 3000);
  } catch (error) {
    importExportMessage.value = error.message || "导入失败";
  } finally {
    importExportLoading.value = false;
  }
}

async function handleExport(format) {
  exportMenuOpen.value = false;
  if (importExportLoading.value) return;

  const editor = editorRef.value;
  const html = editor ? editor.getHtml() : content.value;
  if (!html.trim()) {
    importExportMessage.value = "内容为空，无法导出";
    setTimeout(() => (importExportMessage.value = ""), 3000);
    return;
  }

  try {
    importExportLoading.value = true;
    importExportMessage.value = `正在导出${format === "docx" ? "Word 文档" : format === "md" ? "Markdown" : format === "pdf" ? "PDF 文档" : "富文本"}……`;

    const fileTitle = title.value || "专栏文章";
    if (format === "docx") {
      exportDocx(html, fileTitle);
    } else if (format === "md") {
      await exportMarkdown(html, fileTitle);
    } else if (format === "pdf") {
      await exportUiPdf(fileTitle);
      return;
    } else {
      exportHtml(html, fileTitle);
    }

    importExportMessage.value = "导出成功";
    setTimeout(() => (importExportMessage.value = ""), 3000);
  } catch (error) {
    importExportMessage.value = error.message || "导出失败";
  } finally {
    importExportLoading.value = false;
  }
}

async function exportUiPdf(fileTitle) {
  closeInsertPanel();
  insertToolbarVisible.value = false;
  uiPdfPrintOpen.value = true;
  document.body.classList.add("ui-pdf-printing");
  await nextTick();

  const finishPrint = () => {
    uiPdfPrintOpen.value = false;
    document.body.classList.remove("ui-pdf-printing");
    window.removeEventListener("afterprint", finishPrint);
  };
  window.addEventListener("afterprint", finishPrint);
  window.print();

  void fileTitle;
}

async function handleLocalImage(file, _insertFn) {
  imageMessage.value = "正在压缩本地图片……";
  try {
    const prepared = await prepareImageBlob(file);
    const fallbackDescription = String(file.name || "本地图片").replace(
      /\.[^.]+$/,
      "",
    );
    editingImageNode.value = null;
    pendingContentImage.value = prepared;
    imageDialogPreview.value = prepared.dataUrl;
    imageDialogDescription.value = fallbackDescription;
    imageDialogOpen.value = true;
    imageMessage.value = `图片已压缩为 ${(prepared.blob.size / 1024).toFixed(0)}KB，请确认预览和注释。`;
  } catch (error) {
    imageMessage.value = error.message || "本地图片处理失败";
    throw error;
  }
}

function openImageCaptionDialog(event) {
  if (event?.detail?.editor !== editorRef.value || !event.detail.image) return;
  const image = event.detail.image;
  editingImageNode.value = image;
  pendingContentImage.value = null;
  imageDialogPreview.value = String(image.src || "");
  imageDialogDescription.value = String(image.caption || image.alt || "");
  imageDialogOpen.value = true;
}

async function chooseImageDialogFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    imageMessage.value = "正在压缩替换图片……";
    const prepared = await prepareImageBlob(file);
    pendingContentImage.value = prepared;
    imageDialogPreview.value = prepared.dataUrl;
    if (!imageDialogDescription.value.trim()) {
      imageDialogDescription.value = String(file.name || "本地图片").replace(
        /\.[^.]+$/,
        "",
      );
    }
  } catch (error) {
    imageMessage.value = error.message || "替换图片处理失败";
  }
}

function closeImageDialog() {
  imageDialogOpen.value = false;
  pendingContentImage.value = null;
  editingImageNode.value = null;
  imageDialogPreview.value = "";
  imageDialogDescription.value = "";
}

function confirmImageDialog() {
  const description = imageDialogDescription.value.trim();
  const src = pendingContentImage.value?.dataUrl || imageDialogPreview.value;
  if (!description || !src) return;
  const editor = editorRef.value;
  const saved = editingImageNode.value
    ? updateImageCaptionBlock(editor, editingImageNode.value, {
        src,
        caption: description,
        alt: description,
      })
    : insertImageCaptionBlock(editor, {
        src,
        caption: description,
        alt: description,
      });
  if (!saved) {
    imageMessage.value = "图片未能插入，请先点击正文中的插入位置后重试。";
    return;
  }
  content.value = editor.getHtml();
  imageMessage.value = editingImageNode.value
    ? "图片和注释已更新。"
    : "已插入由图片和注释组成的完整图片块；发布时将上传本地图片。";
  closeImageDialog();
}

async function chooseCover(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    await coverCropper.value?.open(file);
  } catch (error) {
    imageMessage.value = error.message || "无法打开封面图片";
  }
}

function applyCoverCrop(prepared) {
  coverPrepared.value = prepared;
  coverPreview.value = prepared.dataUrl;
  coverRemoved.value = false;
  pendingCoverHash.value = "";
  imageMessage.value = `封面已裁剪为 1200×675（${(prepared.blob.size / 1024).toFixed(0)}KB），发布时上传。`;
}

function removeCover() {
  coverPrepared.value = null;
  coverPreview.value = "";
  coverRemoved.value = true;
  pendingCoverHash.value = "";
  imageMessage.value = "文章封面已移除，提交后生效。";
}

function applyPost(post) {
  if (!post) return;
  const incomingCitations = Array.isArray(post.citations)
    ? post.citations.map((citation) => ({
        number: Number(citation.number),
        text: String(citation.text || ""),
      }))
    : [];
  const cards = Array.isArray(post.classificationCards)
    ? post.classificationCards
    : post.classificationCard
      ? [post.classificationCard]
      : [];
  const preparedCards = cards.map((card) =>
    createSidebarCard(card.type === "custom" ? "custom" : "taxonomy", card),
  );
  const normalizedContent = normalizeCitationLinks(
    migrateLegacyPostCardMarkers(
      normalizeLegacyImageCaptionHtml(post.content || ""),
      preparedCards,
    ),
    incomingCitations,
  );
  editingPost.value = { ...post, content: normalizedContent };
  title.value = post.title || "";
  author.value = post.author || "";
  content.value = normalizedContent;
  tags.value = Array.isArray(post.tags) ? [...post.tags] : [];
  citations.value = incomingCitations;
  license.value = post.license || license.value;
  changeNote.value = post.changeNote || "";
  submittedAt.value = post.submittedAt || "";
  isMinorChange.value = false;
  agreementAccepted.value = post.visibility !== "PRIVATE";
  coverPrepared.value = null;
  coverPreview.value = post.coverUrl || "";
  coverRemoved.value = false;
  pendingCoverHash.value = "";
  sidebarCards.value = reconcileCardPlacements(
    preparedCards,
    normalizedContent,
  );

  if (editorRef.value) editorRef.value.setHtml(normalizedContent);
}

async function applyArticleDraft(draft) {
  const payload = draft?.payload || {};
  title.value = payload.title || "";
  author.value = payload.author || "";
  tags.value = Array.isArray(payload.tags) ? [...payload.tags] : [];
  citations.value = Array.isArray(payload.citations)
    ? payload.citations.map((citation) => ({
        number: Number(citation.number),
        text: String(citation.text || ""),
      }))
    : [];
  license.value = payload.license || "支持闭源";
  changeNote.value = payload.changeNote || "";
  submittedAt.value = payload.submittedAt || "";
  isMinorChange.value = Boolean(payload.isMinorChange);
  agreementAccepted.value = false;
  coverPrepared.value = null;
  coverPreview.value = payload.coverPreview || "";
  coverRemoved.value = Boolean(payload.coverRemoved);
  pendingCoverHash.value = payload.pendingCoverHash || "";
  if (payload.coverDataUrl) {
    const prepared = await preparedFromDataUrl(payload.coverDataUrl);
    coverPrepared.value = { ...prepared, dataUrl: payload.coverDataUrl };
    coverPreview.value = payload.coverDataUrl;
    pendingCoverHash.value = "";
  }
  const cards = Array.isArray(payload.cards)
    ? payload.cards
    : Array.isArray(payload.sidebarCards)
      ? payload.sidebarCards
      : [];
  const preparedCards = await Promise.all(
    cards.map(async (source) => {
      const card = createSidebarCard(
        source.type === "custom" ? "custom" : "taxonomy",
        source,
      );
      if (source.imageDataUrl) {
        const prepared = await preparedFromDataUrl(source.imageDataUrl);
        card.pendingImage = { ...prepared, dataUrl: source.imageDataUrl };
        card.imagePreview = source.imageDataUrl;
        card.imageHash = "";
      }
      return card;
    }),
  );
  content.value = normalizeCitationLinks(
    migrateLegacyPostCardMarkers(
      normalizeLegacyImageCaptionHtml(payload.content || ""),
      preparedCards,
    ),
    payload.citations || [],
  );
  sidebarCards.value = reconcileCardPlacements(preparedCards, content.value);
  markdownSource.value = payload.markdownSource || "";
  if (editorRef.value) editorRef.value.setHtml(content.value);
}

async function loadEditingPost() {
  if (!editId.value) return;
  await userStore.initialize();
  const post = await fetchPost(editId.value);
  if (!userStore.isLoggedIn || post.creatorUid !== userStore.user?.uid) {
    throw new Error("只有文章作者可以进入编辑模式");
  }
  applyPost(post);
}

async function loadArticleDraft() {
  if (!draftQueryId.value) return null;
  const draft = await getDraft(draftQueryId.value);
  if (!draft || draft.contentType !== "ARTICLE") {
    throw new Error("文章草稿不存在或已被删除");
  }
  const allowedOwners = new Set(visibleDraftOwnerKeys(userStore.user));
  if (!allowedOwners.has(draft.ownerKey)) {
    throw new Error("这个草稿属于此设备上的其他账号");
  }
  if (
    draft.mode === "EDIT" &&
    draft.targetId &&
    draft.targetId !== editId.value
  ) {
    throw new Error("草稿关联的文章与当前编辑目标不一致，请从草稿箱重新打开");
  }
  if (
    editingPost.value &&
    draft.baseVersion &&
    Number(draft.baseVersion) !== Number(editingPost.value.version)
  ) {
    const keepDraft = window.confirm(
      `服务器文章已经从 v${draft.baseVersion} 更新到 v${editingPost.value.version}。\n\n继续载入本地草稿可能覆盖新内容。仍要载入吗？`,
    );
    if (!keepDraft) return null;
  }
  await applyArticleDraft(draft);
  currentDraftOwnerKey.value = draft.ownerKey;
  draftAutosave.setDraft(draft);
  return draft;
}

function resetArticleEditor() {
  title.value = "";
  author.value = "";
  content.value = "";
  tags.value = [];
  citations.value = [];
  license.value = "支持闭源";
  changeNote.value = "";
  submittedAt.value = "";
  isMinorChange.value = false;
  agreementAccepted.value = false;
  coverPrepared.value = null;
  coverPreview.value = "";
  coverRemoved.value = false;
  pendingCoverHash.value = "";
  sidebarCards.value = [];
  markdownSource.value = "";
  if (editorRef.value) editorRef.value.setHtml("");
}

async function initializeArticleEditor() {
  draftAutosave.setReady(false);
  errorMessage.value = "";
  editingPost.value = null;
  resetArticleEditor();
  currentDraftOwnerKey.value = "";
  draftAutosave.setDraft(null);
  try {
    await userStore.initialize();
    currentDraftOwnerKey.value = userDraftOwnerKey(userStore.user);
    if (editId.value) await loadEditingPost();
    await loadArticleDraft();
    await nextTick();
  } catch (error) {
    errorMessage.value = error.message || "无法加载文章或草稿";
  } finally {
    draftAutosave.setReady(true);
  }
}

function addTag() {
  const tag = tagInput.value.trim();
  if (!tag || tags.value.includes(tag)) return;

  tags.value.push(tag);
  tagInput.value = "";
}

function removeTag(index) {
  tags.value.splice(index, 1);
}

function addSidebarCard(type = "taxonomy") {
  if (sidebarCards.value.length >= 8) return;
  sidebarCards.value.push(createSidebarCard(type));
}

function removeSidebarCard(index) {
  const [removed] = sidebarCards.value.splice(index, 1);
  if (removed) {
    replaceEditorContent(removeBodyCardMarker(content.value, removed.id));
  }
}

function changeSidebarCardType(card) {
  const nextType = card.type === "custom" ? "custom" : "taxonomy";
  if (nextType === "custom" && card.title === "科学分类")
    card.title = "自定义卡片";
  if (nextType === "taxonomy" && card.title === "自定义卡片")
    card.title = "科学分类";
  card.rows =
    nextType === "taxonomy"
      ? defaultTaxonomyRows()
      : [createSidebarRow({}, "custom"), createSidebarRow({}, "custom")];
}

function addSidebarCardRow(card) {
  if (card.rows.length >= 60) return;
  card.rows.push(createSidebarRow({}, card.type));
}

function removeSidebarCardRow(card, index) {
  card.rows.splice(index, 1);
}

async function chooseSidebarCardImage(event, card) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    imageMessage.value = "正在处理卡片图片……";
    const prepared = await prepareImageBlob(file);
    card.pendingImage = prepared;
    card.imagePreview = prepared.dataUrl;
    card.imageHash = "";
    imageMessage.value = `卡片图片已压缩为 ${(prepared.blob.size / 1024).toFixed(0)}KB，发布时上传。`;
  } catch (error) {
    imageMessage.value = error.message || "卡片图片处理失败";
  }
}

function removeSidebarCardImage(card) {
  card.pendingImage = null;
  card.imagePreview = "";
  card.imageHash = "";
  card.imageCaption = "";
}

function cardPreviewRows(card) {
  if (card.type === "taxonomy") {
    return card.rows
      .filter((row) => row.rankKey)
      .map((row) => ({ ...row, rank: TAXONOMY_RANK_MAP.get(row.rankKey) }))
      .filter((row) => row.rank);
  }
  return card.rows.filter((row) => row.label?.trim() || row.value?.trim());
}

const uiPdfPrintHtml = computed(() => {
  const html = decorateRichHtml(
    renderFormulaNodes(normalizeCitationLinks(content.value, citations.value)),
    { codeCopy: false },
  );
  if (typeof DOMParser === "undefined") return html;
  const parsed = new DOMParser().parseFromString(
    `<body>${html}</body>`,
    "text/html",
  );
  sidebarCards.value
    .filter((card) => card.placements.includes("body"))
    .forEach((card) => {
      const anchor = parsed.body.querySelector(
        `a[href="#post-card-${CSS.escape(card.id)}"]`,
      );
      if (!anchor || anchor.closest("[data-life-post-card]")) return;
      const holder = parsed.createElement("template");
      holder.innerHTML = classificationCardHtml(card);
      const node = holder.content.firstElementChild;
      if (node) anchor.parentElement?.replaceWith(node);
      else anchor.remove();
    });
  return parsed.body.innerHTML;
});

function classificationCardHtml(card) {
  const rows = cardPreviewRows(card);
  const rowHtml = rows
    .map((row) => {
      const label =
        card.type === "taxonomy"
          ? `<span>${escapeMarkup(row.rank.zh)}</span><small>${escapeMarkup(row.rank.en)}</small>`
          : `<span>${escapeMarkup(row.label || "字段")}</span>`;
      return `<tr><th>${label}</th><td>${escapeMarkup(row.value || "—")}</td></tr>`;
    })
    .join("");
  const imageHtml = card.imagePreview
    ? `<tr class="pdf-card-image"><td colspan="2"><img src="${escapeMarkup(card.imagePreview)}" alt="${escapeMarkup(card.imageCaption)}">${card.imageCaption ? `<small>${escapeMarkup(card.imageCaption)}</small>` : ""}</td></tr>`
    : "";
  const title =
    card.title || (card.type === "taxonomy" ? "科学分类" : "自定义卡片");
  return `<table class="classification-card-preview" style="--classification-color:${escapeMarkup(card.color)};--classification-tint:${escapeMarkup(cardTint(card))};--classification-header-text:${escapeMarkup(cardHeaderText(card))}"><caption>${escapeMarkup(title)}</caption><tbody>${imageHtml}${rowHtml}</tbody></table>`;
}

function cardTint(card) {
  return tintColor(card.color, 0.84);
}

function cardHeaderText(card) {
  return contrastColor(card.color);
}

function sidebarCardsPayload({ draft = false } = {}) {
  return sidebarCards.value.map((card) => ({
    id: card.id,
    type: card.type,
    placements: [...card.placements],
    title:
      card.title.trim() ||
      (card.type === "taxonomy" ? "科学分类" : "自定义卡片"),
    color: card.color,
    imageHash: card.imageHash || "",
    imageCaption: card.imageCaption.trim(),
    ...(draft && card.pendingImage?.dataUrl
      ? { imageDataUrl: card.pendingImage.dataUrl }
      : {}),
    rows: card.rows.map((row) =>
      card.type === "taxonomy"
        ? { rankKey: row.rankKey, value: row.value.trim() }
        : { label: row.label.trim(), value: row.value.trim() },
    ),
  }));
}

async function uploadSidebarCardImages() {
  let completed = 0;
  const pendingCards = sidebarCards.value.filter((card) => card.pendingImage);
  for (const card of pendingCards) {
    imageMessage.value = `正在上传卡片图片 ${completed + 1}/${pendingCards.length}……`;
    const uploaded = await uploadPreparedImage(card.pendingImage);
    card.imageHash = uploaded.hash;
    card.imagePreview = uploaded.url;
    card.pendingImage = null;
    completed += 1;
  }
}

function escapeMarkup(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tintColor(color, strength = 0.82) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return "#f7f1fa";
  const value = Number.parseInt(match[1], 16);
  const channels = [value >> 16, (value >> 8) & 255, value & 255];
  return `#${channels
    .map((channel) =>
      Math.round(channel + (255 - channel) * strength)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function contrastColor(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return "#25313b";
  const value = Number.parseInt(match[1], 16);
  const red = value >> 16;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return red * 0.299 + green * 0.587 + blue * 0.114 > 160
    ? "#25313b"
    : "#ffffff";
}

function insertResearchTree() {
  const tree = researchTrees.value.find(
    (item) => item.id === selectedTreeId.value,
  );
  if (!tree) return;
  const marker = `<p><a href="/life-tree/${encodeURIComponent(tree.id)}">🌳 进化树：${escapeMarkup(tree.title)}</a></p><p><br></p>`;
  const editor = editorRef.value;
  if (typeof editor?.dangerouslyInsertHtml === "function") {
    editor.focus();
    editor.dangerouslyInsertHtml(marker);
    content.value = editor.getHtml();
  } else {
    content.value += marker;
  }
  treeListMessage.value = `已插入“${tree.title}”`;
  selectedTreeId.value = "";
  closeInsertPanel();
}

async function loadResearchTrees() {
  try {
    researchTrees.value = await fetchTreeList("USER");
  } catch (error) {
    researchTrees.value = [];
    treeListMessage.value = error.message || "进化树列表加载失败";
  }
}

async function submitPost(targetVisibility = "PUBLIC") {
  errorMessage.value = "";
  // 若处于 Markdown 模式，先把最新源码同步到 HTML
  if (editMode.value === "markdown") {
    if (markdownSyncTimer) clearTimeout(markdownSyncTimer);
    try {
      content.value = markdownToSafeHtml(markdownEditorSource.value);
    } catch (error) {
      errorMessage.value = error.message || "Markdown 解析失败，请检查公式语法";
      return;
    }
  }
  const savingPrivate = targetVisibility === "PRIVATE";

  await userStore.initialize();
  if (!userStore.isLoggedIn) {
    errorMessage.value = savingPrivate
      ? "请先登录后再保存为仅自己可见"
      : "制作无需登录；发布文章前请先登录或注册";
    return;
  }

  if (!savingPrivate && !title.value.trim()) {
    errorMessage.value = "请输入帖子标题";
    return;
  }

  if (!savingPrivate && !plainContent.value) {
    errorMessage.value = "请输入帖子内容";
    return;
  }

  if (!savingPrivate && !agreementAccepted.value) {
    errorMessage.value = "请先确认提交声明";
    return;
  }

  if (draftAutosave.saveMode.value === "auto") {
    await draftAutosave.saveNow().catch(() => {});
  }
  draftAutosave.setReady(false);
  uploadingImages.value = true;
  let publishedContent;
  let coverHash = pendingCoverHash.value || undefined;
  try {
    if (coverPrepared.value) {
      imageMessage.value = "正在上传文章封面……";
      const uploadedCover = await uploadPreparedImage(coverPrepared.value);
      coverHash = uploadedCover.hash;
      pendingCoverHash.value = uploadedCover.hash;
      coverPreview.value = uploadedCover.url;
      coverPrepared.value = null;
    } else if (coverRemoved.value) {
      coverHash = "";
    }
    await uploadSidebarCardImages();
    publishedContent = await uploadHtmlDataImages(
      content.value,
      (completed, total) => {
        imageMessage.value = total
          ? `正在上传文章图片 ${completed}/${total}……`
          : imageMessage.value;
      },
    );
  } catch (error) {
    errorMessage.value =
      error.message ||
      "文章图片上传失败；当前页面内容尚未提交，请不要刷新或关闭页面";
    uploadingImages.value = false;
    draftAutosave.setReady(true);
    return;
  }
  uploadingImages.value = false;
  const currentSubmittedAt = new Date().toISOString();
  const effectiveSubmittedAt = isMinorChange.value
    ? editingPost.value?.submittedAt || currentSubmittedAt
    : currentSubmittedAt;
  submittedAt.value = effectiveSubmittedAt;
  const revisionCount = isMinorChange.value
    ? editingPost.value?.revisionCount || 1
    : (editingPost.value?.revisionCount || 0) + 1;
  const generatedNote = `${formatDateTime(currentSubmittedAt)} 第${revisionCount}次${isEditing.value ? "修改" : "提交"}`;
  const submissionNote = savingPrivate
    ? ""
    : isMinorChange.value
      ? changeNote.value.trim()
      : changeNote.value.trim() || generatedNote;

  emit(
    "submit",
    {
      id: editId.value || null,
      version: editingPost.value?.version || 1,
      title: title.value.trim(),
      creator: creator.value,
      creatorUid: editingPost.value?.creatorUid || userStore.user?.uid || null,
      author: author.value.trim() || creator.value,
      content: publishedContent,
      contentType: "html",
      classificationCards: sidebarCardsPayload(),
      citations: sortedCitations.value.map((citation) => ({ ...citation })),
      tags: [...tags.value],
      license: license.value,
      viewCount,
      submittedAt: effectiveSubmittedAt,
      updatedAt: currentSubmittedAt,
      revisionCount,
      changeNote: submissionNote,
      minorChangeNote: isMinorChange.value ? changeNote.value.trim() : "",
      isMinorChange: isMinorChange.value,
      visibility: targetVisibility,
      ...(coverHash !== undefined ? { coverHash } : {}),
    },
    { draftId: draftAutosave.draftId.value, visibility: targetVisibility },
  );
}

watch(
  () =>
    [route.query.edit, route.query.draft, route.query.saved]
      .map((value) => String(value || ""))
      .join("|"),
  initializeArticleEditor,
  { immediate: true },
);
watch(
  () => props.submitting,
  (value, previous) => {
    if (previous && !value) draftAutosave.setReady(true);
  },
);
onMounted(() => {
  floatingToolbarsEnabled.value =
    window.localStorage.getItem("life-editor-floating-tools") !== "off";
  loadResearchTrees();
  window.addEventListener(CITATION_MENU_EVENT, openCitationDialog);
  window.addEventListener(FORMULA_MENU_EVENT, openFormulaDialog);
  window.addEventListener(INSERT_MENU_EVENT, openInsertPanel);
  window.addEventListener(IMAGE_CAPTION_MENU_EVENT, openImageCaptionDialog);
  window.addEventListener(POST_CARD_CONTENT_EVENT, syncSidebarCardsFromEditor);
  document.addEventListener("selectionchange", handleEditorSelectionChange);
  document.addEventListener("keydown", handleEditorShortcut);
  window.addEventListener("resize", handleEditorSelectionChange);
  window.addEventListener("scroll", handleEditorSelectionChange, true);
});

onBeforeUnmount(() => {
  window.removeEventListener(CITATION_MENU_EVENT, openCitationDialog);
  window.removeEventListener(FORMULA_MENU_EVENT, openFormulaDialog);
  window.removeEventListener(INSERT_MENU_EVENT, openInsertPanel);
  window.removeEventListener(IMAGE_CAPTION_MENU_EVENT, openImageCaptionDialog);
  window.removeEventListener(
    POST_CARD_CONTENT_EVENT,
    syncSidebarCardsFromEditor,
  );
  document.removeEventListener("selectionchange", handleEditorSelectionChange);
  document.removeEventListener("keydown", handleEditorShortcut);
  window.removeEventListener("resize", handleEditorSelectionChange);
  window.removeEventListener("scroll", handleEditorSelectionChange, true);
  toolbarObserver?.disconnect();
  editorRef.value?.destroy();
  document.body.classList.remove("ui-pdf-printing");
});
</script>

<style scoped>
.create-post-page.ui-pdf-page-shell {
  min-height: 100vh;
  padding: 76px 20px 48px;
  background: #f3f4f6;
}

.create-post-page.ui-pdf-page-shell .create-post-form {
  width: min(100%, 960px);
}

.create-post-page.ui-pdf-page-shell .editor-toolbar-fixed {
  top: 0;
}

.create-post-page.ui-pdf-page-shell .editor-wrapper {
  padding-top: 0;
}

.create-post-page {
  min-height: 100vh;
  padding: 84px 20px 60px;
  background: #f8fafc;
}

.create-post-container,
.create-post-form {
  width: min(100%, 960px);
  margin: 0 auto;
}

.create-post-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.create-post-container h1 {
  margin: 0;
  color: #1e293b;
  font-size: 2rem;
}

.draft-save-state {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 0.82rem;
}
.draft-save-state.error {
  color: #b42318;
}
.draft-actions {
  display: flex;
  align-items: stretch;
  gap: 7px;
}
.draft-mode-select {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 9px;
  border: 1px solid #93ac9d;
  border-radius: 7px;
  background: #fff;
  color: #52675e;
  font-size: 0.76rem;
  font-weight: 700;
}
.draft-mode-select select {
  border: 0;
  background: transparent;
  color: #315f4d;
  font: inherit;
  font-weight: 700;
  outline: 0;
}
.draft-actions button,
.draft-actions a {
  padding: 8px 11px;
  border: 1px solid #93ac9d;
  border-radius: 7px;
  background: #fff;
  color: #315f4d;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.draft-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.editing-hint {
  width: min(100%, 960px);
  margin: -8px auto 22px;
  color: #b91c1c;
}

/* 内容区样式 */
.content-area {
  margin-bottom: 16px;
}

.content-title-label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

.content-title-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 1.4rem;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.2s;
}

.content-title-input:focus {
  outline: none;
  border-color: #2f806a;
  box-shadow: 0 0 0 3px rgba(47, 128, 106, 0.1);
}

/* 内容区下方元数据区样式 */
.post-metadata-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px dashed #e2e8f0;
}

.post-metadata-section .cover-editor {
  margin-bottom: 20px;
}

/* 编辑器工具栏固定样式 - 工具栏和偏好设置在同一行 */
.editor-wrapper {
  position: relative;
  padding-top: 56px;
}

.editor-toolbar-fixed {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  height: 56px;
}

.editor-toolbar-fixed :deep(.w-e-toolbar) {
  flex: 1;
  position: static;
  border: none;
  box-shadow: none;
  padding: 0 24px;
}

.editor-toolbar-extras {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 56px;
  flex-shrink: 0;
}

.insert-card-actions {
  display: flex;
  gap: 6px;
}

.insert-card-btn {
  padding: 6px 12px;
  border: 1.5px solid #2f806a;
  border-radius: 6px;
  background: #e8f3ee;
  color: #2b6b57;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.insert-card-btn:hover {
  background: #2f806a;
  color: #fff;
}

.editor-toolbar-extras .citation-panel-toggle-btn {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.editor-toolbar-extras .citation-panel-toggle-btn:hover {
  border-color: #2f806a;
  color: #2f806a;
}

.editor-toolbar-extras .citation-panel-toggle-btn.active {
  border-color: #2f806a;
  background: #eff8f3;
  color: #2f806a;
}

/* 导入/导出下拉菜单 */
.io-dropdown {
  position: relative;
  flex-shrink: 0;
}

.io-dropdown-btn {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.io-dropdown-btn:hover {
  border-color: #2f806a;
  color: #2f806a;
}

.io-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  z-index: 200;
  min-width: 140px;
}

.io-dropdown-menu button {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: #fff;
  color: #334155;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.io-dropdown-menu button:hover {
  background: #f1f5f9;
  color: #2f806a;
}

.editor-wrapper :deep(.w-e-text-container) {
  border-radius: 8px;
}

.editor-wrapper :deep(.w-e-text-placeholder) {
  padding: 8px 16px 0 16px;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .create-post-container {
    display: block;
  }
  .draft-actions {
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .draft-mode-select {
    width: 100%;
    box-sizing: border-box;
    justify-content: space-between;
    padding: 8px 10px;
  }
  .draft-actions button,
  .draft-actions a {
    flex: 1;
    text-align: center;
  }
}

.cover-editor {
  display: grid;
  gap: 12px;
  margin: 4px 0 22px;
  padding: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
}
.cover-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}
.cover-heading > div:first-child {
  display: grid;
  gap: 4px;
}
.cover-heading small {
  color: #64748b;
  line-height: 1.5;
}
.cover-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.cover-actions .remove-cover {
  padding: 8px 12px;
  border: 1px solid #f0b9b5;
  border-radius: 7px;
  background: #fff;
  color: #b42318;
  cursor: pointer;
}
.cover-preview {
  aspect-ratio: 16/9;
  max-height: 420px;
  overflow: hidden;
  border-radius: 8px;
  background: #0f172a;
}
.cover-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-preview.empty {
  display: grid;
  place-items: center;
  border: 1px dashed #94a3b8;
  background: #f1f5f9;
  color: #64748b;
}

.tree-embed-picker {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 8px;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid #b9cbbf;
  border-radius: 8px;
  background: #f2f7f3;
}

.tree-embed-picker > label,
.tree-embed-picker > small {
  grid-column: 1 / -1;
}

.tree-embed-picker select {
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  font: inherit;
}

.tree-embed-picker small {
  color: #607068;
}

.classification-card-editor {
  display: grid;
  gap: 14px;
  margin: 4px 0 18px;
  padding: 17px;
  border: 1px solid #d5d8b6;
  border-radius: 10px;
  background: #fffef7;
}
.classification-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}
.classification-card-heading > div {
  display: grid;
  gap: 4px;
}
.classification-card-heading small {
  color: #747665;
  line-height: 1.5;
}
.classification-card-heading > label {
  display: grid;
  min-width: 230px;
  gap: 5px;
  color: #4f5545;
  font-size: 0.82rem;
  font-weight: 700;
}
.classification-card-heading select,
.classification-card-settings input,
.classification-rank-row select,
.classification-rank-row input {
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid #cfd3bd;
  border-radius: 7px;
  background: #fff;
  color: #30372f;
  font: inherit;
}
.classification-card-settings {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(280px, 0.8fr);
  gap: 12px;
}
.classification-card-settings > label {
  display: grid;
  gap: 6px;
  color: #4f5545;
  font-size: 0.84rem;
  font-weight: 700;
}
.classification-rank-rows {
  display: grid;
  gap: 7px;
}
.classification-rank-row {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(260px, 1fr) 36px;
  gap: 7px;
}
.classification-rank-row button {
  border: 1px solid #e0c7c3;
  border-radius: 7px;
  background: #fff;
  color: #a0453d;
  font-size: 1.1rem;
  cursor: pointer;
}
.classification-card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.classification-card-actions small {
  color: #777b6d;
}
.classification-card-preview {
  width: min(100%, 410px);
  margin: 4px auto 0;
  border: 1px solid #c8c8c0;
  border-collapse: separate;
  border-spacing: 0;
  background: #f8f9fa;
  color: #202122;
  font-family: Arial,\"Noto Sans SC\",sans-serif;
  font-size: 0.86rem;
  overflow: hidden;
}
.classification-card-preview caption {
  padding: 9px 10px;
  background: var(--classification-color);
  color: var(--classification-header-text);
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
}
.classification-card-preview th,
.classification-card-preview td {
  padding: 6px 8px;
  border-top: 1px solid rgba(162, 164, 166, 0.35);
  text-align: left;
  vertical-align: top;
}
.classification-card-preview th {
  width: 48%;
  background: var(--classification-tint);
  font-weight: 700;
}
.classification-card-preview th span,
.classification-card-preview th small {
  display: block;
}
.classification-card-preview th small {
  margin-top: 2px;
  color: #54595d;
  font-size: 0.72rem;
  font-weight: 500;
}
.classification-card-preview td {
  background: #fff;
}
.classification-card-preview td[colspan] {
  padding: 18px;
  color: #72777d;
  text-align: center;
}

.add-sidebar-card-actions {
  display: flex !important;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}
.add-sidebar-card-actions button {
  padding: 8px 11px;
  border: 1px solid #7b7d48;
  border-radius: 7px;
  background: #fff;
  color: #5f612f;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
.add-sidebar-card-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.sidebar-card-editor-item {
  display: grid;
  gap: 13px;
  padding: 15px;
  border: 1px solid #d8dac1;
  border-radius: 9px;
  background: #fff;
}
.sidebar-card-editor-item > header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ececdd;
}
.sidebar-card-editor-item > header strong {
  margin-right: auto;
  color: #555837;
}
.sidebar-card-editor-item > header select {
  padding: 8px 10px;
  border: 1px solid #cfd3bd;
  border-radius: 7px;
  background: #fff;
  font: inherit;
}
.remove-sidebar-card {
  padding: 8px 10px;
  border: 1px solid #dfbdb7;
  border-radius: 7px;
  background: #fff;
  color: #a13f39;
  cursor: pointer;
}
.sidebar-card-image-editor {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
}
.sidebar-card-image-editor > label {
  position: relative;
  overflow: hidden;
  padding: 8px 11px;
  border: 1px solid #aebaa5;
  border-radius: 7px;
  background: #f7faf5;
  color: #3f604c;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
.sidebar-card-image-editor > label input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.sidebar-card-image-editor img {
  width: 100%;
  max-height: 190px;
  grid-column: 1/-1;
  object-fit: contain;
  border: 1px solid #d6d9ca;
  border-radius: 7px;
  background: #f7f7f2;
}
.sidebar-card-image-editor > input {
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid #cfd3bd;
  border-radius: 7px;
  font: inherit;
}
.sidebar-card-image-editor > button {
  padding: 8px 10px;
  border: 1px solid #dfbdb7;
  border-radius: 7px;
  background: #fff;
  color: #a13f39;
  cursor: pointer;
}
.classification-preview-image td[colspan] {
  padding: 0 !important;
  background: #fff;
}
.classification-preview-image img {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: contain;
}
.classification-preview-image small {
  display: block;
  padding: 5px 8px;
  color: #54595d;
  text-align: center;
}
.no-sidebar-cards {
  margin: 0;
  padding: 18px;
  border: 1px dashed #c8caaa;
  border-radius: 8px;
  color: #77795d;
  text-align: center;
}

.card-placement-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 11px 12px;
  border: 1px solid #d9dece;
  border-radius: 8px;
  background: #f8faf6;
}
.card-placement-options legend {
  padding: 0 6px;
  color: #555837;
  font-size: 0.82rem;
  font-weight: 750;
}
.card-placement-options label {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 2px 8px;
  padding: 9px;
  border: 1px solid #e0e5d7;
  border-radius: 7px;
  background: #fff;
  color: #3f4d43;
  cursor: pointer;
}
.card-placement-options input {
  width: auto;
  margin-top: 2px;
  accent-color: #39745a;
}
.card-placement-options span {
  font-size: 0.84rem;
  font-weight: 750;
}
.card-placement-options small {
  grid-column: 2;
  color: #747d74;
  font-size: 0.72rem;
  line-height: 1.4;
}
.card-placement-options label:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.72;
}

.create-post-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.create-post-form > label,
.tag-section > label,
.submission-section > label {
  margin-top: 8px;
  color: #334155;
  font-weight: 600;
}

.create-post-form input,
.create-post-form select,
.create-post-form textarea {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #1e293b;
  font: inherit;
}

.create-post-form textarea {
  resize: vertical;
}

.create-post-form input:focus,
.create-post-form select:focus,
.create-post-form textarea:focus {
  border-color: #4a90e2;
  outline: 2px solid rgba(74, 144, 226, 0.15);
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 6px 0 8px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.metadata-item {
  min-width: 0;
}

.metadata-item label,
.metadata-item small {
  display: block;
}

.metadata-item label {
  margin-bottom: 6px;
  color: #334155;
  font-weight: 600;
}

.metadata-item small {
  margin-top: 4px;
  color: #94a3b8;
}

.editor-wrapper {
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.ui-pdf-mode .editor-layout {
  align-items: flex-start;
  margin-top: 20px;
}

.ui-pdf-mode .editor-wrapper {
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.ui-pdf-mode .post-editor {
  width: min(100%, 794px);
  min-height: 1123px;
  margin: 0 auto 36px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
}

.ui-pdf-mode .editor-wrapper :deep(.w-e-text-container) {
  min-height: 1123px;
  border-radius: 0;
  background: repeating-linear-gradient(
    to bottom,
    #fff 0 1122px,
    #e5e7eb 1122px 1123px
  );
}

.ui-pdf-mode .editor-wrapper :deep(.w-e-text-container [data-slate-editor]) {
  min-height: 1123px;
  padding: var(--ui-pdf-editor-padding, 64px 68px 72px);
  line-height: var(--ui-pdf-line-height, 1.72);
}

.ui-pdf-mode
  .editor-wrapper
  :deep([data-slate-editor] .w-e-textarea-divider hr) {
  width: 100%;
  height: 32px;
  margin: 12px 0;
  border: 0;
  border-top: 1px dashed #94a3b8;
  background: transparent;
}

.pdf-density-compact {
  --ui-pdf-editor-padding: 52px 58px 58px;
  --ui-pdf-line-height: 1.56;
}

.pdf-density-normal {
  --ui-pdf-editor-padding: 64px 68px 72px;
  --ui-pdf-line-height: 1.72;
}

.pdf-density-relaxed {
  --ui-pdf-editor-padding: 76px 78px 84px;
  --ui-pdf-line-height: 1.9;
}

.pdf-columns-two .editor-wrapper :deep([data-slate-editor]) {
  column-count: 2;
  column-gap: var(--ui-pdf-column-gap, 30px);
}

.pdf-columns-three .editor-wrapper :deep([data-slate-editor]) {
  column-count: 3;
  column-gap: var(--ui-pdf-column-gap, 22px);
}

.pdf-template-academic .editor-wrapper :deep([data-slate-editor]) {
  color: #1f2937;
  font-family: "Source Han Serif SC", "Noto Serif CJK SC", Georgia, serif;
}

.pdf-template-minimal .editor-wrapper :deep([data-slate-editor]) {
  color: #374151;
  font-family: Inter, "Segoe UI", "Microsoft YaHei", sans-serif;
}

.pdf-template-minimal .editor-wrapper :deep([data-slate-editor] h2) {
  padding-bottom: 7px;
  border-bottom: 1px solid #e5e7eb;
}

.pdf-template-magazine .editor-wrapper :deep([data-slate-editor]) {
  color: #111827;
  font-family: Inter, "Segoe UI", "Microsoft YaHei", sans-serif;
  letter-spacing: 0.01em;
}

.pdf-template-magazine .editor-wrapper :deep([data-slate-editor] h1),
.pdf-template-magazine .editor-wrapper :deep([data-slate-editor] h2) {
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ui-pdf-mode .editor-wrapper :deep(.w-e-text-placeholder) {
  padding: 72px 68px 0;
}

.floating-tools-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  font: inherit;
  cursor: pointer;
}

.floating-tools-toggle.active {
  border-color: #70acd5;
  background: #eff8fe;
  color: #176fa9;
}

.floating-tools-toggle-track {
  position: relative;
  display: inline-block;
  width: 26px;
  height: 14px;
  border-radius: 999px;
  background: #a8b4bf;
  transition: background 0.16s;
}

.floating-tools-toggle-track i {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
  transition: transform 0.16s;
}

.floating-tools-toggle.active .floating-tools-toggle-track {
  background: #2486ce;
}

.floating-tools-toggle.active .floating-tools-toggle-track i {
  transform: translateX(12px);
}

.editor-wrapper.floating-tools-disabled :deep(.w-e-hover-bar) {
  display: none !important;
}

.caret-insert-toolbar {
  position: fixed;
  z-index: 1250;
  display: flex;
  box-sizing: border-box;
  width: max-content;
  max-width: calc(100vw - 16px);
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  padding: 5px;
  border: 1px solid #d8dee5;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.18);
  scrollbar-width: thin;
}

.caret-insert-toolbar-label {
  padding: 0 7px;
  color: #7b8793;
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
}

.caret-insert-toolbar button {
  display: grid;
  min-width: 36px;
  height: 34px;
  padding: 0 7px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #56616b;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  place-items: center;
  cursor: pointer;
  white-space: nowrap;
}

.caret-insert-toolbar button:hover,
.caret-insert-toolbar button:focus-visible {
  background: #eaf5fd;
  color: #1678b9;
  outline: none;
}

.caret-insert-divider {
  width: 1px;
  height: 24px;
  flex: 0 0 auto;
  margin: 0 3px;
  background: #e2e8f0;
}

.post-editor {
  min-height: 360px;
}

/* ===== Markdown 编辑模式 ===== */
.markdown-mode-toolbar-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f0f7ff;
  border-bottom: 1px solid #d0e1f5;
}
.markdown-mode-badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: #1d4ed8;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
}
.markdown-mode-tip {
  color: #475569;
  font-size: 0.82rem;
}
.edit-mode-switch {
  display: inline-flex;
  border: 1px solid #c8d3df;
  border-radius: 7px;
  overflow: hidden;
}
.edit-mode-btn {
  padding: 5px 14px;
  border: none;
  background: #fff;
  color: #64748b;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.edit-mode-btn.active {
  background: #1d4ed8;
  color: #fff;
}
.markdown-editor {
  display: flex;
  flex-direction: column;
  min-height: 360px;
  border: 1px solid #d7dee6;
  border-top: none;
  background: #fff;
}
.markdown-editor-tabs {
  display: flex;
  border-bottom: 1px solid #d7dee6;
  background: #f8fafc;
}
.markdown-editor-tab {
  padding: 8px 22px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #64748b;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}
.markdown-editor-tab.active {
  border-bottom-color: #1d4ed8;
  color: #1d4ed8;
  background: #fff;
}
.markdown-editor-textarea {
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  min-height: 360px;
  padding: 14px 18px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.7;
  color: #1e293b;
  background: #fff;
}
.markdown-editor-preview {
  flex: 1;
  min-height: 360px;
  padding: 16px 20px;
  overflow: auto;
  color: #25313b;
  line-height: 1.75;
}
.markdown-editor-preview :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
}
.markdown-editor-preview :deep(figure) {
  width: fit-content;
  max-width: 100%;
  margin: 1.5em auto;
  text-align: center;
}
.markdown-editor-preview :deep(figcaption) {
  margin-top: 8px;
  color: #8795a4;
  font-size: 0.88rem;
}

.editor-wrapper :deep(.w-e-text-container [data-slate-editor]) {
  box-sizing: border-box;
  min-height: 360px;
  padding: 8px 16px 120px 16px;
  cursor: text;
  line-height: 1.7;
}

.editor-wrapper :deep(.w-e-text-container [data-slate-editor] > p:first-child) {
  margin-top: 0;
}

.editor-wrapper :deep(.w-e-text-container [data-slate-editor] > p) {
  margin-top: 0;
  margin-bottom: 0.5em;
}

.editor-wrapper :deep(.w-e-text-container [data-slate-editor] table) {
  display: block;
  box-sizing: border-box;
  width: max-content;
  min-width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  -webkit-overflow-scrolling: touch;
}

.editor-wrapper :deep(.w-e-text-container [data-slate-editor] pre) {
  max-width: 100%;
  overflow-x: auto;
}

.editor-wrapper
  :deep(.w-e-text-container [data-slate-editor] div[data-w-e-type="todo"]) {
  display: flex;
  align-items: flex-start;
  gap: 0.45em;
}

.editor-wrapper :deep(.w-e-text-container [data-slate-editor] strong),
.editor-wrapper :deep(.w-e-text-container [data-slate-editor] strong *),
.editor-wrapper :deep(.w-e-text-container [data-slate-editor] b),
.editor-wrapper :deep(.w-e-text-container [data-slate-editor] b *) {
  font-weight: 900 !important;
  font-synthesis: weight;
}

.editor-wrapper :deep(.life-image-caption-block) {
  box-sizing: border-box;
  width: fit-content;
  max-width: 100%;
  margin: 24px auto;
  padding: 0;
  text-align: center;
}

.editor-wrapper :deep(.life-image-caption-block.is-selected) {
  outline: 2px solid rgba(36, 134, 206, 0.42);
  outline-offset: 5px;
}

.editor-wrapper :deep(.life-image-caption-block img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
}

.editor-wrapper :deep(.life-image-caption-block figcaption) {
  margin-top: 10px;
  color: #8a98a8;
  font-size: 0.9rem;
  line-height: 1.6;
  text-align: center;
}

.editor-wrapper :deep(.w-e-text-container [data-slate-editor] sup) {
  position: relative;
  top: -0.35em;
  vertical-align: baseline;
  font-size: 0.72em;
  line-height: 0;
}

.editor-wrapper
  :deep(.w-e-text-container [data-slate-editor] a[href*="#post-citation-"]),
.editor-wrapper
  :deep(.w-e-text-container [data-slate-editor] a[href*="#post-citation-"] *) {
  padding: 0 0.12em;
  border-radius: 0.22em;
  background: rgba(22, 131, 216, 0.1);
  color: #087fd1 !important;
  font-weight: 850 !important;
  text-decoration: none;
}

.editor-wrapper
  :deep(.w-e-text-container [data-slate-editor] a[href^="#post-card-"]) {
  display: inline-block;
  padding: 0.35em 0.65em;
  border: 1px solid #b7cdbf;
  border-radius: 0.45em;
  background: #eef6f1;
  color: #27664b !important;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 0.9em;
  font-weight: 750;
  text-decoration: none;
}

.tag-section,
.submission-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.tag-input-row {
  display: flex;
  gap: 8px;
}

.tag-input-row input {
  flex: 1;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.9rem;
}

.tag-item button {
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.submission-section h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.15rem;
}

.minor-change-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 12px;
  border: 1px solid aquamarine;
  border-radius: 6px;
  color: aquamarine;
  cursor: pointer;
}

.minor-change-option input {
  width: auto;
  accent-color: aquamarine;
}

.agreement-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
}

.agreement-row input {
  width: auto;
}

.server-save-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.server-save-actions > button {
  flex: 1 1 220px;
}

.server-save-actions .private-save-button {
  border: 1px solid #6f8f83;
  background: #fff;
  color: #315f50;
}

.private-save-hint {
  display: block;
  margin-top: 8px;
  color: #71817c;
  font-size: 0.78rem;
  line-height: 1.5;
}

.submission-options {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.submission-options label {
  color: #334155;
  font-weight: 600;
}

.submission-options small {
  grid-column: 2;
  margin-top: 4px;
  color: #94a3b8;
  display: block;
  line-height: 1.4;
}

.error-message {
  margin: 4px 0 0;
  color: #dc2626;
}

.image-message {
  margin: -4px 0 2px;
  color: #0f5f91;
  font-size: 0.86rem;
}

.library-button {
  width: auto !important;
  padding: 8px 11px !important;
  border: 1px solid #4f7799 !important;
  border-radius: 7px !important;
  background: #fff !important;
  color: #315f83 !important;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
.markdown-importer {
  margin-bottom: 10px;
  border: 1px solid #c8d3df;
  border-radius: 9px;
  background: #f8fafc;
}
.markdown-importer details {
  padding: 13px;
}
.markdown-importer summary {
  color: #334155;
  font-weight: 800;
  cursor: pointer;
}
.markdown-importer p {
  color: #64748b;
  line-height: 1.5;
}
.markdown-importer textarea {
  box-sizing: border-box;
  width: 100%;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}
.markdown-tabs {
  display: flex;
  gap: 0;
  margin: 6px 0 8px;
  border-bottom: 1px solid #c8d3df;
}
.markdown-tab {
  padding: 7px 18px;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 7px 7px 0 0;
  background: transparent;
  color: #64748b;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}
.markdown-tab.active {
  border-color: #c8d3df;
  background: #fff;
  color: #1d4ed8;
}
.markdown-preview-live {
  margin-top: 0;
  min-height: 220px;
  max-height: 360px;
}
.markdown-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 9px;
}
.markdown-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.markdown-message {
  margin: 9px 0;
  color: #356b59 !important;
  font-size: 0.86rem;
}
.markdown-preview {
  max-height: 360px;
  overflow: auto;
  margin-top: 10px;
  padding: 16px;
  border: 1px solid #d7dee6;
  border-radius: 7px;
  background: #fff;
  color: #25313b;
}
.markdown-preview :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
}
.markdown-preview :deep(figure) {
  width: fit-content;
  max-width: 100%;
  margin: 1.5em auto;
  text-align: center;
}
.markdown-preview :deep(figcaption) {
  margin-top: 8px;
  color: #8795a4;
  font-size: 0.88rem;
  line-height: 1.55;
}
.content-image-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #d5dee7;
  border-radius: 8px;
  background: #f8fafc;
}
.content-image-actions small {
  color: #64748b;
  line-height: 1.45;
}

.content-image-dialog-backdrop {
  position: fixed;
  z-index: 1320;
  inset: 0;
  display: grid;
  padding: 24px;
  place-items: center;
  background: rgba(15, 23, 42, 0.62);
}
.content-image-dialog {
  display: grid;
  box-sizing: border-box;
  width: min(820px, 100%);
  max-height: calc(100vh - 48px);
  gap: 14px;
  overflow: auto;
  padding: 20px;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 26px 90px rgba(15, 23, 42, 0.32);
}
.content-image-dialog > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.content-image-dialog h2 {
  margin: 0;
  color: #1e3348;
  font-size: 1.25rem;
}
.content-image-dialog header p {
  margin: 4px 0 0;
  color: #65788b;
}
.content-image-dialog header > button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #eef3f7;
  color: #526679;
  font-size: 1.4rem;
  cursor: pointer;
}
.content-image-dialog-preview {
  box-sizing: border-box;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
}
.content-image-dialog-preview img {
  display: block;
  max-width: 100%;
  max-height: 52vh;
  margin: 0 auto;
  border-radius: 8px;
  object-fit: contain;
}
.content-image-dialog-preview figcaption {
  margin-top: 9px;
  color: #8795a4;
  font-size: 0.9rem;
  line-height: 1.55;
}
.content-image-dialog-file {
  position: relative;
  width: max-content;
  overflow: hidden;
  padding: 8px 11px;
  border: 1px solid #8aa9bf;
  border-radius: 7px;
  background: #f6fafc;
  color: #315f83;
  font-weight: 750;
  cursor: pointer;
}
.content-image-dialog-file input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.content-image-dialog-caption {
  display: grid;
  gap: 7px;
  color: #324b60;
  font-weight: 750;
}
.content-image-dialog-caption textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #cbd7e1;
  border-radius: 8px;
  font: inherit;
  line-height: 1.6;
  resize: vertical;
}
.content-image-dialog > footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.content-image-dialog > footer button {
  padding: 9px 13px;
  border: 1px solid #c8d4de;
  border-radius: 7px;
  background: #fff;
  color: #52687a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.content-image-dialog > footer .confirm {
  border-color: #1683d8;
  background: #1683d8;
  color: #fff;
}
.content-image-dialog > footer button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.insert-tools-backdrop {
  position: fixed;
  z-index: 1100;
  inset: 0;
  display: grid;
  padding: 24px;
  place-items: center;
  background: rgba(15, 23, 42, 0.6);
}
.insert-tools-dialog {
  display: flex;
  box-sizing: border-box;
  width: min(1080px, 100%);
  max-height: min(860px, calc(100vh - 48px));
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 26px 90px rgba(15, 23, 42, 0.32);
}
.insert-tools-heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
}
.insert-tools-heading h2 {
  margin: 0;
  color: #1e3348;
  font-size: 1.25rem;
}
.insert-tools-heading p {
  margin: 4px 0 0;
  color: #65788b;
}
.insert-tools-back {
  align-self: center;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #405b72;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.insert-tools-close {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #eef3f7;
  color: #526679;
  font-size: 1.4rem;
  cursor: pointer;
}
.insert-tools-menu {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  overflow: auto;
  padding: 22px;
}
.insert-tools-menu > button {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  align-items: center;
  gap: 2px 13px;
  padding: 17px;
  border: 1px solid #d8e1e8;
  border-radius: 12px;
  background: #fff;
  color: #30485d;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.16s,
    background 0.16s,
    transform 0.16s;
}
.insert-tools-menu > button:hover {
  border-color: #65a6d2;
  background: #f4faff;
  transform: translateY(-1px);
}
.insert-tools-menu > button:last-child:nth-child(odd) {
  grid-column: 1/-1;
}
.insert-tool-icon {
  display: grid;
  width: 46px;
  height: 46px;
  grid-row: 1/3;
  place-items: center;
  border-radius: 10px;
  background: #eaf4fb;
  color: #1e78b5;
  font-size: 1.05rem;
  font-weight: 850;
}
.insert-tools-menu strong {
  font-size: 0.98rem;
}
.insert-tools-menu small {
  color: #718396;
  line-height: 1.45;
}
.insert-tool-section {
  box-sizing: border-box;
  overflow: auto;
  margin: 0 !important;
  padding: 20px !important;
  border: 0 !important;
  border-radius: 0 !important;
}
.insert-tools-dialog > .tree-embed-picker {
  grid-template-columns: minmax(220px, 1fr) auto;
}
.insert-tools-dialog > .markdown-importer {
  background: #fff;
}
.insert-tools-dialog > .markdown-importer details {
  padding: 0;
}
.insert-tools-dialog > .markdown-importer summary {
  display: none;
}

.citation-dialog-backdrop {
  position: fixed;
  z-index: 1300;
  inset: 0;
  display: grid;
  padding: 24px;
  place-items: center;
  background: rgba(15, 23, 42, 0.6);
}
.citation-dialog {
  display: grid;
  width: min(760px, 100%);
  max-height: min(720px, calc(100vh - 48px));
  gap: 15px;
  overflow: auto;
  padding: 20px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 26px 90px rgba(15, 23, 42, 0.3);
}
.citation-dialog > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.citation-dialog h2 {
  margin: 0;
  color: #1e3348;
  font-size: 1.25rem;
}
.citation-dialog header p {
  margin: 4px 0 0;
  color: #65788b;
}
.citation-dialog header > button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #eef3f7;
  color: #526679;
  font-size: 1.4rem;
  cursor: pointer;
}
.citation-mode-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.citation-mode-actions button {
  padding: 10px 12px;
  border: 1px solid #c9d6e2;
  border-radius: 8px;
  background: #fff;
  color: #47627a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.citation-mode-actions button.active {
  border-color: #2486ce;
  background: #eaf5fd;
  color: #126cae;
}
.citation-mode-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.existing-citation-list {
  display: grid;
  max-height: 360px;
  gap: 7px;
  overflow: auto;
}
.existing-citation-list > button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 9px;
  padding: 11px 12px;
  border: 1px solid #d6e0e8;
  border-radius: 8px;
  background: #fff;
  color: #354b5e;
  text-align: left;
  cursor: pointer;
}
.existing-citation-list > button.selected {
  border-color: #2486ce;
  background: #f0f8fe;
}
.existing-citation-list strong {
  color: #1683d8;
  font-weight: 800;
}
.existing-citation-list span {
  overflow: hidden;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.new-citation-field {
  display: grid;
  gap: 7px;
  color: #324b60;
  font-weight: 750;
}
.new-citation-field textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #cbd7e1;
  border-radius: 8px;
  font: inherit;
  line-height: 1.6;
  resize: vertical;
}
.new-citation-field small {
  color: #718395;
  font-weight: 400;
}
.citation-dialog > footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.citation-dialog > footer > span {
  margin-right: auto;
  color: #738395;
  font-size: 0.78rem;
}
.citation-dialog > footer button {
  padding: 9px 13px;
  border: 1px solid #c8d4de;
  border-radius: 7px;
  background: #fff;
  color: #52687a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.citation-dialog > footer .confirm {
  border-color: #1683d8;
  background: #1683d8;
  color: #fff;
}
.citation-dialog > footer button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.existing-citation-pane {
  display: grid;
  min-height: 0;
  gap: 9px;
}
.citation-search {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  color: #52697c;
  font-size: 0.8rem;
  font-weight: 750;
}
.citation-search input {
  min-width: 0;
  padding: 9px 11px;
  border: 1px solid #ccd9e3;
  border-radius: 7px;
  background: #fff;
  font: inherit;
}
.existing-citation-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 7px;
  padding: 7px;
  border: 1px solid #d6e0e8;
  border-radius: 8px;
  background: #fff;
}
.existing-citation-row.selected {
  border-color: #2486ce;
  background: #f0f8fe;
}
.citation-select {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  padding: 4px;
  border: 0;
  background: transparent;
  color: #354b5e;
  text-align: left;
  cursor: pointer;
}
.citation-select strong {
  color: #1683d8;
  font-weight: 850;
}
.citation-select span {
  overflow: hidden;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.citation-select small {
  padding: 3px 7px;
  border-radius: 999px;
  background: #e8f1f7;
  color: #526f83;
  font-size: 0.68rem;
  white-space: nowrap;
}
.citation-select small.unused {
  background: #e6f5eb;
  color: #217046;
}
.citation-row-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.citation-row-actions button {
  padding: 5px 8px;
  border: 1px solid #c7d5df;
  border-radius: 6px;
  background: #fff;
  color: #3f647e;
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
}
.citation-row-actions button.delete {
  border-color: #e1c3bf;
  color: #a1433c;
}
.citation-row-actions button.blocked {
  border-color: #d8dee3;
  color: #89959e;
}
.citation-inline-editor,
.citation-delete-confirm {
  display: grid;
  grid-column: 1/-1;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #d8e4ec;
}
.citation-inline-editor textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 11px;
  border: 1px solid #b9cfde;
  border-radius: 7px;
  font: inherit;
  line-height: 1.6;
  resize: vertical;
}
.citation-inline-editor > div,
.citation-delete-confirm > div {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
}
.citation-inline-editor small {
  margin-right: auto;
  color: #718395;
}
.citation-inline-editor button,
.citation-delete-confirm button {
  padding: 6px 9px;
  border: 1px solid #c8d4de;
  border-radius: 6px;
  background: #fff;
  color: #52687a;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}
.citation-inline-editor button.save {
  border-color: #1683d8;
  background: #1683d8;
  color: #fff;
}
.citation-inline-editor button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.citation-delete-confirm {
  color: #8b3f39;
  font-size: 0.8rem;
  line-height: 1.5;
}
.citation-delete-confirm button.confirm-delete {
  border-color: #bb4b43;
  background: #bb4b43;
  color: #fff;
}
.citation-empty-search {
  margin: 18px 0;
  color: #718395;
  text-align: center;
}
.citation-message {
  margin: 0;
  padding: 9px 11px;
  border-radius: 7px;
  background: #eef6fb;
  color: #315f7d;
  font-size: 0.8rem;
  line-height: 1.5;
}
.formula-dialog-backdrop {
  position: fixed;
  z-index: 1310;
  inset: 0;
  display: grid;
  padding: 24px;
  place-items: center;
  background: rgba(15, 23, 42, 0.6);
}
.formula-dialog {
  display: grid;
  width: min(720px, 100%);
  max-height: calc(100vh - 48px);
  gap: 15px;
  overflow: auto;
  padding: 20px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 26px 90px rgba(15, 23, 42, 0.3);
}
.formula-dialog > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.formula-dialog h2 {
  margin: 0;
  color: #1e3348;
  font-size: 1.25rem;
}
.formula-dialog header p {
  margin: 4px 0 0;
  color: #65788b;
}
.formula-dialog header > button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #eef3f7;
  color: #526679;
  font-size: 1.4rem;
  cursor: pointer;
}
.formula-mode-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.formula-mode-actions button {
  padding: 10px 12px;
  border: 1px solid #c9d6e2;
  border-radius: 8px;
  background: #fff;
  color: #47627a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.formula-mode-actions button.active {
  border-color: #2486ce;
  background: #eaf5fd;
  color: #126cae;
}
.formula-mode-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}
.formula-source-field {
  display: grid;
  gap: 7px;
  color: #324b60;
  font-weight: 750;
}
.formula-source-field textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd7e1;
  border-radius: 8px;
  font:
    15px/1.6 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  resize: vertical;
}
.formula-preview {
  display: grid;
  min-height: 100px;
  gap: 9px;
  overflow: auto;
  padding: 13px;
  border: 1px solid #d7e1e9;
  border-radius: 9px;
  background: #f8fafc;
}
.formula-preview > span {
  color: #5b7083;
  font-size: 0.8rem;
  font-weight: 800;
}
.formula-preview > div {
  overflow-x: auto;
  padding: 8px;
  text-align: center;
}
.formula-preview > p {
  margin: auto;
  color: #8292a1;
}
.formula-preview.error {
  border-color: #e5a5a5;
  background: #fff7f7;
}
.formula-preview.error > p {
  color: #b42318;
}
.formula-dialog > footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.formula-dialog > footer > span {
  margin-right: auto;
  color: #738395;
  font-size: 0.78rem;
}
.formula-dialog > footer button {
  padding: 9px 13px;
  border: 1px solid #c8d4de;
  border-radius: 7px;
  background: #fff;
  color: #52687a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.formula-dialog > footer .confirm {
  border-color: #1683d8;
  background: #1683d8;
  color: #fff;
}
.formula-dialog > footer button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.create-post-form > button {
  align-self: flex-start;
  margin-top: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #4a90e2;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
}

.create-post-form > button:hover:not(:disabled),
.secondary-button:hover {
  background: #3a7bc8;
}

.create-post-form > button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.secondary-button {
  flex: 0 0 auto;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #64748b;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
}

@media (max-width: 640px) {
  .editor-toolbar-extras {
    padding: 7px 9px;
    gap: 6px;
  }
  .floating-tools-toggle span {
    display: none;
  }
  .citation-panel-toggle-btn {
    padding: 6px 8px;
    font-size: 0.75rem;
  }
  .caret-insert-toolbar-label {
    display: none;
  }
  .caret-insert-toolbar button {
    min-width: 34px;
    padding: 0 6px;
  }
  .classification-card-heading {
    display: grid;
  }
  .classification-card-heading > label {
    min-width: 0;
  }
  .add-sidebar-card-actions {
    justify-content: flex-start;
  }
  .sidebar-card-editor-item > header {
    align-items: stretch;
    flex-direction: column;
  }
  .sidebar-card-editor-item > header strong {
    margin-right: 0;
  }
  .classification-card-settings,
  .card-placement-options {
    grid-template-columns: 1fr;
  }
  .sidebar-card-image-editor {
    grid-template-columns: 1fr;
  }
  .sidebar-card-image-editor img {
    grid-column: auto;
  }
  .classification-rank-row {
    grid-template-columns: 1fr 36px;
  }
  .classification-rank-row input {
    grid-column: 1/-1;
    grid-row: 2;
  }
  .classification-card-actions {
    align-items: flex-start;
    flex-direction: column;
  }
  .cover-heading {
    flex-direction: column;
  }
  .cover-actions {
    justify-content: flex-start;
  }
  .content-image-actions {
    align-items: flex-start;
    flex-direction: column;
  }
  .markdown-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
  .markdown-actions button {
    width: 100%;
  }
  .content-image-dialog-backdrop {
    align-items: end;
    padding: 0;
  }
  .content-image-dialog {
    width: 100%;
    max-height: 92vh;
    padding: 15px;
    border-radius: 16px 16px 0 0;
  }
  .content-image-dialog-preview img {
    max-height: 42vh;
  }
  .content-image-dialog > footer button {
    flex: 1;
  }
  .insert-tools-backdrop {
    align-items: end;
    padding: 0;
  }
  .insert-tools-dialog {
    width: 100%;
    max-height: 92vh;
    border-radius: 16px 16px 0 0;
  }
  .insert-tools-heading {
    grid-template-columns: auto minmax(0, 1fr) auto;
    padding: 14px;
  }
  .insert-tools-heading p {
    display: none;
  }
  .insert-tools-menu {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 14px;
  }
  .insert-tools-menu > button:last-child:nth-child(odd) {
    grid-column: auto;
  }
  .insert-tool-section {
    padding: 14px !important;
  }
  .insert-tools-dialog > .tree-embed-picker {
    grid-template-columns: 1fr;
  }
  .insert-tools-dialog > .tree-embed-picker > button {
    width: 100%;
  }
  .insert-tools-back {
    padding: 7px 8px;
    font-size: 0.82rem;
  }
  .citation-dialog-backdrop {
    align-items: end;
    padding: 0;
  }
  .citation-dialog {
    width: 100%;
    max-height: 90vh;
    padding: 15px;
    border-radius: 16px 16px 0 0;
  }
  .citation-mode-actions {
    grid-template-columns: 1fr;
  }
  .citation-dialog > footer {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .citation-dialog > footer > span {
    width: 100%;
    margin-right: 0;
  }
  .citation-dialog > footer button {
    flex: 1;
  }
  .citation-search {
    grid-template-columns: 1fr;
  }
  .existing-citation-row {
    grid-template-columns: 1fr;
  }
  .citation-select {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .citation-select small {
    grid-column: 2;
    justify-self: start;
  }
  .citation-select span {
    white-space: normal;
  }
  .citation-row-actions {
    justify-content: flex-end;
  }
  .citation-inline-editor,
  .citation-delete-confirm {
    grid-column: 1;
  }
  .citation-delete-confirm > div {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .citation-delete-confirm button {
    width: 100%;
  }
  .formula-dialog-backdrop {
    align-items: end;
    padding: 0;
  }
  .formula-dialog {
    width: 100%;
    max-height: 90vh;
    padding: 15px;
    border-radius: 16px 16px 0 0;
  }
  .formula-dialog > footer {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .formula-dialog > footer > span {
    width: 100%;
    margin-right: 0;
  }
  .formula-dialog > footer button {
    flex: 1;
  }
  .create-post-page {
    padding: 76px 12px 40px;
  }

  .create-post-form {
    padding: 20px 14px;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .tag-input-row,
  .submission-options {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}

/* 编辑器布局 */
.editor-layout {
  position: relative;
}

.editor-layout .editor-wrapper {
  width: 100%;
}

/* 左侧参考文献面板 - 浮动定位 */
.citation-panel {
  width: 260px;
  position: fixed;
  left: 20px;
  top: 140px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  max-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 50;
}

.citation-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* 添加按钮 */
.citation-add-btn {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 12px;
  border: 1px dashed #94a3b8;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.citation-add-btn:hover {
  border-color: #2f806a;
  background: #eff8f3;
  color: #2f806a;
}

/* 引用列表 */
.citation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.citation-item {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.15s;
}

.citation-item.unused {
  border-color: #cbd5e1;
  opacity: 0.75;
}

.citation-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.citation-number {
  font-size: 0.85rem;
  color: #2f806a;
  font-weight: 700;
}

.citation-usage {
  font-size: 0.7rem;
  color: #64748b;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  flex: 1;
  text-align: center;
}

.citation-usage.unused {
  color: #94a3b8;
  font-style: italic;
}

.citation-item-actions {
  display: flex;
  gap: 4px;
}

.citation-action-btn {
  padding: 3px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: #fff;
  color: #475569;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s;
}

.citation-action-btn:hover {
  background: #f1f5f9;
}

.citation-action-btn.delete {
  color: #dc2626;
  border-color: #fecaca;
}

.citation-action-btn.delete:hover:not(:disabled) {
  background: #fef2f2;
}

.citation-action-btn.delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.citation-item-content {
  margin-bottom: 8px;
}

.citation-text-preview {
  margin: 0;
  padding: 8px;
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.5;
  background: #f8fafc;
  border-radius: 6px;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.citation-edit-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.78rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.citation-edit-textarea:focus {
  outline: none;
  border-color: #2f806a;
  box-shadow: 0 0 0 2px rgba(47, 128, 106, 0.15);
}

.citation-insert-btn {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #2f806a;
  border-radius: 6px;
  background: #eff8f3;
  color: #2f806a;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.citation-insert-btn:hover {
  background: #2f806a;
  color: #fff;
}

.citation-empty {
  margin: 0;
  padding: 20px 12px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.82rem;
}

/* 响应式：小屏幕时隐藏侧边栏 */
@media (max-width: 1100px) {
  .citation-panel {
    position: static;
    width: 100%;
    max-height: 200px;
    margin-bottom: 12px;
  }
}
</style>

<style>
.ui-pdf-print-root {
  display: none;
}

@media print {
  body.ui-pdf-printing > * {
    display: none !important;
  }

  body.ui-pdf-printing > .ui-pdf-print-root {
    display: block !important;
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
    color: #111827;
    font-family: "Source Han Serif SC", "Noto Serif CJK SC", serif;
    line-height: var(--ui-pdf-line-height, 1.72);
  }

  body.ui-pdf-printing .caret-insert-toolbar,
  body.ui-pdf-printing .w-e-hover-bar,
  body.ui-pdf-printing .editor-toolbar-fixed,
  body.ui-pdf-printing .insert-tool-panel {
    display: none !important;
    visibility: hidden !important;
  }

  .ui-pdf-print-root h1 {
    font-size: 26px;
    line-height: 1.3;
  }

  .pdf-template-minimal.ui-pdf-print-root {
    font-family: Inter, "Segoe UI", "Microsoft YaHei", sans-serif;
    color: #374151;
  }

  .pdf-template-magazine.ui-pdf-print-root {
    font-family: Inter, "Segoe UI", "Microsoft YaHei", sans-serif;
    color: #111827;
    letter-spacing: 0.01em;
  }

  .ui-pdf-print-root h2 {
    margin: 28px 0 12px;
    font-size: 19px;
  }

  .ui-pdf-print-body p {
    margin: 0 0 0.55em;
  }

  .pdf-columns-two.ui-pdf-print-root .ui-pdf-print-body,
  .pdf-columns-two.ui-pdf-print-root .ui-pdf-print-references {
    column-count: 2;
    column-gap: var(--ui-pdf-column-gap, 30px);
  }

  .pdf-columns-three.ui-pdf-print-root .ui-pdf-print-body,
  .pdf-columns-three.ui-pdf-print-root .ui-pdf-print-references {
    column-count: 3;
    column-gap: var(--ui-pdf-column-gap, 22px);
  }

  .ui-pdf-print-body hr {
    width: 100%;
    height: 0;
    margin: 0;
    border: 0;
    break-after: page;
    page-break-after: always;
  }

  .ui-pdf-print-body h1,
  .ui-pdf-print-body h3,
  .ui-pdf-print-body h4,
  .ui-pdf-print-body h5,
  .ui-pdf-print-body h6 {
    margin: 20px 0 10px;
  }

  .ui-pdf-print-body img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 12px auto;
  }

  .ui-pdf-print-body pre,
  .ui-pdf-print-body blockquote {
    margin: 12px 0;
    padding: 10px 14px;
    border-left: 3px solid #d1d5db;
    background: #f9fafb;
  }

  .ui-pdf-print-cards .classification-card-preview,
  .ui-pdf-print-body .classification-card-preview {
    width: 100%;
    margin: 18px 0;
    border: 1px solid var(--classification-color);
    border-collapse: collapse;
    background: #fff;
    font-size: 12px;
  }

  .ui-pdf-print-cards .classification-card-preview caption,
  .ui-pdf-print-body .classification-card-preview caption {
    padding: 8px;
    background: var(--classification-color);
    color: var(--classification-header-text);
    font-weight: 700;
  }

  .ui-pdf-print-cards .classification-card-preview th,
  .ui-pdf-print-cards .classification-card-preview td,
  .ui-pdf-print-body .classification-card-preview th,
  .ui-pdf-print-body .classification-card-preview td {
    padding: 7px 9px;
    border: 1px solid #d1d5db;
    text-align: left;
    vertical-align: top;
  }

  .ui-pdf-print-cards .classification-card-preview th span,
  .ui-pdf-print-body .classification-card-preview th span {
    display: block;
    font-weight: 700;
  }

  .ui-pdf-print-cards .classification-card-preview th small,
  .ui-pdf-print-body .classification-card-preview th small {
    color: #6b7280;
  }

  .ui-pdf-print-references ol {
    margin: 0;
    padding-left: 24px;
  }

  .ui-pdf-print-references li {
    margin-bottom: 6px;
    font-size: 12px;
  }

  @page {
    size: A4;
    margin: 18mm 16mm;
  }
}
</style>
