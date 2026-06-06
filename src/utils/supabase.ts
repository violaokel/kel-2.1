import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jeiszujaheqxaztrilsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_S-gpNu2EHnYr3VjVDVgVpw_aB1KSf-N";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
