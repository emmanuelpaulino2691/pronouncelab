# Supabase foundation

Apply the migrations in filename order with the Supabase CLI or the
Supabase SQL migration workflow:

1. `202607170001_content_schema.sql`
2. `202607170002_content_rls.sql`
3. `202607170003_content_storage.sql`

The migrations create four Storage buckets:

- `content-audio-drafts`: private, audio only, 25 MB limit
- `content-image-drafts`: private, raster images only, 10 MB limit
- `content-audio`: public published audio, 25 MB limit
- `content-images`: public published raster images, 10 MB limit

Draft objects are readable only by authenticated content managers and
writable only by editors or administrators. Published objects are publicly
readable; publishers or administrators can upload new immutable published
objects, and only administrators can delete them.

## Required project setup

1. Create or select the Supabase project.
2. Apply all migrations.
3. Create the first administrator in Supabase Auth.
4. Bootstrap the first `admin` role with a trusted SQL session:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('AUTH_USER_UUID', 'admin');
   ```

5. Set local deployment environment variables from `.env.example`:
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
6. Confirm the four bucket visibility settings and MIME limits in the
   Supabase dashboard.
7. Test the RLS policies with anonymous, editor, publisher, and admin
   sessions before enabling future admin screens.

Never place a Supabase service-role key in a Vite environment variable or
browser bundle. The application does not read course content from Supabase
in this phase; the current local content provider remains authoritative.
