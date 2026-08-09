from models.candidate import create_candidate


def start_candidate(name):
    if not name or not name.strip():
        return None

    candidate = create_candidate(name.strip())

    return candidate