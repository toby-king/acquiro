-- matches.score is a Pinecone similarity score (0.0–1.0), not an integer.
alter table public.matches
  alter column score type numeric using score::numeric;
