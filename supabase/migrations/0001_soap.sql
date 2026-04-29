create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists rfps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  source_kind text not null check (source_kind in ('text', 'pdf', 'seed')),
  source_pdf_path text,
  source_text text,
  detail jsonb not null,
  last_matched_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists rfps_detail_gin on rfps using gin (detail jsonb_path_ops);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id text not null,
  tag text not null,
  owner_id text,
  page int not null default 1,
  chunk_index int not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_document_id_idx on document_chunks (document_id);
create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 50);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  rfp_id uuid not null references rfps(id) on delete cascade,
  requirement_id text not null,
  requirement_section text,
  requirement_text text not null,
  assignee_id text not null,
  assignment_reason text,
  status text not null default 'open' check (status in ('open', 'done')),
  closed_by text,
  evidence_chunk_ids uuid[],
  evidence_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rfp_id, requirement_id)
);

create index if not exists tasks_rfp_id_idx on tasks (rfp_id);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  rfp_id uuid not null unique references rfps(id) on delete cascade,
  markdown text not null,
  used_document_ids text[],
  model text not null default 'gemini-3.1-pro-preview',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function match_chunks(query_embedding vector, k int)
returns table (
  id uuid,
  document_id text,
  tag text,
  page int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.tag,
    c.page,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from document_chunks c
  order by c.embedding <=> query_embedding
  limit k
$$;
