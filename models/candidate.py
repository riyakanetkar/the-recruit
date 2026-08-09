from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY


supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def create_candidate(name):
    response = (
        supabase
        .table("candidates")
        .insert({"name": name})
        .execute()
    )

    return response.data[0]