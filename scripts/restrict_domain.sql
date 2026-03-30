-- SECURE DOMAIN RESTRICTION TRIGGER
-- Only allow @eji.co.id domains to sign up/in

-- 1. Create the function
CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@eji.co.id' THEN
    RAISE EXCEPTION 'Access Denied: Only @eji.co.id email addresses are allowed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger (executes before signup/login)
DROP TRIGGER IF EXISTS tr_restrict_domain ON auth.users;
CREATE TRIGGER tr_restrict_domain
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION check_email_domain();
