-- Create storage bucket for personal uploads
insert into storage.buckets (id, name, public)
values ('personal-uploads', 'personal-uploads', true);

-- Create table to track uploaded files
create table public.personal_uploads (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  description text,
  created_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.personal_uploads enable row level security;

-- Policy: Only yanzeyucq@163.com can insert files
create policy "Only specific user can upload files"
on public.personal_uploads
for insert
to authenticated
with check (
  auth.jwt() ->> 'email' = 'yanzeyucq@163.com'
);

-- Policy: Only yanzeyucq@163.com can view their uploads
create policy "Only specific user can view their uploads"
on public.personal_uploads
for select
to authenticated
using (
  auth.jwt() ->> 'email' = 'yanzeyucq@163.com' and
  user_id = auth.uid()
);

-- Policy: Only yanzeyucq@163.com can delete their uploads
create policy "Only specific user can delete their uploads"
on public.personal_uploads
for delete
to authenticated
using (
  auth.jwt() ->> 'email' = 'yanzeyucq@163.com' and
  user_id = auth.uid()
);

-- Storage policies for personal-uploads bucket
create policy "Only specific user can upload files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'personal-uploads' and
  auth.jwt() ->> 'email' = 'yanzeyucq@163.com'
);

create policy "Anyone can view uploaded files"
on storage.objects
for select
to authenticated
using (bucket_id = 'personal-uploads');

create policy "Only specific user can delete files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'personal-uploads' and
  auth.jwt() ->> 'email' = 'yanzeyucq@163.com'
);

-- Create index for faster queries
create index idx_personal_uploads_user_id on public.personal_uploads(user_id);
create index idx_personal_uploads_created_at on public.personal_uploads(created_at desc);