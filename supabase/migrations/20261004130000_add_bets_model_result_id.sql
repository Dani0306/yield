-- Links a bet to the model result it was placed from (the Draw odds page),
-- so the result can show that its bet is pending. One bet per result; the
-- unique constraint also indexes the column. Deleting a result keeps the bet.
alter table public.bets
  add column model_result_id bigint
    references public.model_results (id) on delete set null,
  add constraint bets_model_result_id_key unique (model_result_id);
