-- Historial del chat: conversations y messages.
-- Un solo dueño por fila (user_id = auth.uid()), con RLS en ambas tablas.

-- ---------------------------------------------------------------------------
-- Función compartida para mantener updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_id_updated_at_idx
  on public.conversations (user_id, updated_at desc);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  channel text not null default 'pwa' check (channel in ('pwa', 'telegram')),
  created_at timestamptz not null default now()
);

create index messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);

create index messages_user_id_idx
  on public.messages (user_id);

-- ---------------------------------------------------------------------------
-- Permisos: solo el rol authenticated; anon no ve nada.
-- ---------------------------------------------------------------------------
revoke all on public.conversations from anon;
revoke all on public.messages from anon;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations: el dueño las lee"
  on public.conversations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "conversations: el dueño las crea"
  on public.conversations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "conversations: el dueño las edita"
  on public.conversations for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "conversations: el dueño las borra"
  on public.conversations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "messages: el dueño los lee"
  on public.messages for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Solo se puede escribir un mensaje en una conversación propia.
create policy "messages: el dueño los crea en sus conversaciones"
  on public.messages for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "messages: el dueño los edita"
  on public.messages for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "messages: el dueño los borra"
  on public.messages for delete
  to authenticated
  using ((select auth.uid()) = user_id);
