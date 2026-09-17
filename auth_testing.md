# Auth-Gated App Testing Playbook (Homes Finder)

Admin uses Emergent Google Auth. To test admin-gated APIs/pages, create a session directly.

## Step 1: Create admin test user & session (DB: test_database)
mongosh --eval "
use('test_database');
var userId = 'user_testadmin01';
var sessionToken = 'test_session_admin_' + Date.now();
db.users.updateOne({user_id:userId},{\$set:{user_id:userId,email:'hamid.aliuxb@gmail.com',name:'Admin',role:'admin',created_at:new Date()}},{upsert:true});
db.user_sessions.insertOne({user_id:userId,session_token:sessionToken,expires_at:new Date(Date.now()+7*24*60*60*1000),created_at:new Date()});
print('SESSION_TOKEN='+sessionToken);
"

## Step 2: Backend API tests
- GET /api/auth/me   -> header Authorization: Bearer <SESSION_TOKEN>  (returns role:admin)
- Public: GET /api/properties , GET /api/properties/{slug} , GET /api/settings
- Public: POST /api/leads  (name, mobile required) -> saves + emails owner
- Admin: POST/PUT/DELETE /api/properties , GET/PUT/DELETE /api/leads , PUT /api/settings , POST /api/upload
  All admin routes require Bearer token; without token -> 401, with non-admin -> 403.

## Step 3: Browser (admin UI)
Set cookie session_token then navigate to /admin:
await page.context.add_cookies([{ "name":"session_token","value":"<SESSION_TOKEN>",
  "domain":"homes-finder-dubai.preview.emergentagent.com","path":"/","httpOnly":True,"secure":True,"sameSite":"None"}])
await page.goto(".../admin")

## Notes
- Frontend calls use withCredentials (cookie) OR you can rely on cookie set via /auth/session.
- Property images served publicly at /api/files/{path}.
