PRAGMA foreign_keys = ON;

-- 私密文件夹：只对创建者（及 ADMIN / 站点所有者）返回的文件夹。
-- 用途：私密文章的归档位——公开文章任何人可放进文件夹，
--       私密文章只有作者本人能放，且只能放进私密文件夹。
ALTER TABLE folders ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;
