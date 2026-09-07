-- U000001 is the permanent site owner and must always remain an active administrator.
UPDATE users
   SET role = 'ADMIN',
       status = 'ACTIVE',
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
 WHERE public_id = 1;

CREATE TRIGGER IF NOT EXISTS users_protect_site_owner_role
BEFORE UPDATE OF role, status ON users
WHEN OLD.public_id = 1
 AND (NEW.role <> 'ADMIN' OR NEW.status <> 'ACTIVE')
BEGIN
  SELECT RAISE(ABORT, 'SITE_OWNER_MUST_REMAIN_ACTIVE_ADMIN');
END;
