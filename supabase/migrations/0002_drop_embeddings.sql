drop function if exists match_chunks(vector, int);

drop index if exists document_chunks_embedding_idx;
drop index if exists document_chunks_document_id_idx;

drop table if exists document_chunks;

alter table tasks drop column if exists evidence_chunk_ids;
