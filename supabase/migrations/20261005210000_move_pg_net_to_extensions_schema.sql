-- pg_net's functions live in the "net" schema either way; this only moves
-- the extension record out of public (security advisor 0014).
drop extension if exists pg_net;
create extension pg_net with schema extensions;
