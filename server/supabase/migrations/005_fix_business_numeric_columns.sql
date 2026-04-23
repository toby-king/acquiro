-- Financial columns were declared as integer but real data contains both
-- decimals (e.g. monthly rent "1032.5") and values exceeding integer max
-- (2,147,483,647). Changing all financial columns to numeric.

alter table public.business
  alter column asking_price  type numeric using asking_price::numeric,
  alter column turnover      type numeric using turnover::numeric,
  alter column net_profit    type numeric using net_profit::numeric,
  alter column rent          type numeric using rent::numeric,
  alter column leasehold     type numeric using leasehold::numeric,
  alter column ebit          type numeric using ebit::numeric,
  alter column ebitda        type numeric using ebitda::numeric,
  alter column freehold      type numeric using freehold::numeric,
  alter column franchise_fee type numeric using franchise_fee::numeric,
  alter column investment    type numeric using investment::numeric;
