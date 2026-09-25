-- Six more diner languages: Portuguese, German, Arabic, Hindi, Thai, and Tagalog.
alter table public.translations drop constraint translations_language_check;
alter table public.translations add constraint translations_language_check
  check (language in ('en','es','zh','ko','ja','fr','vi','pt','de','ar','hi','th','tl'));
alter table public.dish_insights drop constraint dish_insights_language_check;
alter table public.dish_insights add constraint dish_insights_language_check
  check (language in ('en','es','zh','ko','ja','fr','vi','pt','de','ar','hi','th','tl'));
