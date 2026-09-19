-- 0025's final statement (adding vip_applications_company_url_required)
-- failed against a row that predates the company_url field entirely —
-- it has a company name with no URL captured, since that field didn't
-- exist yet when it was submitted. Clearing company on any such
-- pre-existing row (rather than inventing a URL) lets the constraint
-- go in clean; a real submission going forward can't produce this
-- state at all, since the form and the server action both require
-- company_url the moment company is non-empty.
update public.vip_applications set company = '' where company <> '' and company_url = '';

alter table public.vip_applications
  add constraint vip_applications_company_url_required
    check (company = '' or company_url <> '');
