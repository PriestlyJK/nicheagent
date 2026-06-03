from fastapi import APIRouter, HTTPException, Header
from db.client import get_db
from db.models import ProfileIn, ReactionIn, CommunityNicheIn
import uuid

router = APIRouter()

# ── Users ──────────────────────────────────────────────────────────
users_router = APIRouter()

@users_router.get("/profile/{user_id}")
def get_profile(user_id: uuid.UUID):
    db = get_db()
    profile = db.table("profiles").select("*").eq("id", str(user_id)).single().execute()
    if not profile.data:
        raise HTTPException(404, "Profile not found")
    return profile.data

@users_router.put("/profile/{user_id}")
def update_profile(user_id: uuid.UUID, data: ProfileIn):
    db = get_db()
    result = db.table("profiles").upsert({
        "id": str(user_id),
        **data.model_dump(exclude_none=True),
    }).execute()
    return result.data[0] if result.data else {}

@users_router.get("/profile/{user_id}/saved")
def get_saved_niches(user_id: uuid.UUID):
    db = get_db()
    saved = db.table("saved_niches")\
        .select("niche_id, saved_at, niches(*)")\
        .eq("user_id", str(user_id)).execute()
    return saved.data

@users_router.post("/profile/{user_id}/saved/{niche_id}")
def save_niche(user_id: uuid.UUID, niche_id: uuid.UUID):
    db = get_db()
    db.table("saved_niches").upsert({
        "user_id": str(user_id),
        "niche_id": str(niche_id),
    }).execute()
    return {"saved": True}

@users_router.delete("/profile/{user_id}/saved/{niche_id}")
def unsave_niche(user_id: uuid.UUID, niche_id: uuid.UUID):
    db = get_db()
    db.table("saved_niches")\
        .delete()\
        .eq("user_id", str(user_id))\
        .eq("niche_id", str(niche_id))\
        .execute()
    return {"saved": False}


# ── Social ─────────────────────────────────────────────────────────
social_router = APIRouter()

@social_router.post("/reactions")
def add_reaction(data: ReactionIn, x_user_id: str = Header(...)):
    db = get_db()
    db.table("reactions").upsert({
        "user_id": x_user_id,
        "niche_id": str(data.niche_id),
        "reaction": data.reaction,
        "comment": data.comment,
    }).execute()

    # update interested count — used for matching
    if data.reaction == "interested":
        _check_and_notify_match(str(data.niche_id), x_user_id)

    return {"ok": True}

@social_router.get("/reactions/{niche_id}")
def get_reactions(niche_id: uuid.UUID):
    db = get_db()
    reactions = db.table("reactions").select("*").eq("niche_id", str(niche_id)).execute()
    counts = {"real": 0, "not_real": 0, "interested": 0}
    for r in (reactions.data or []):
        if r["reaction"] in counts:
            counts[r["reaction"]] += 1
    return {"counts": counts, "reactions": reactions.data}

@social_router.post("/community-niches")
def submit_community_niche(data: CommunityNicheIn, x_user_id: str = Header(...)):
    db = get_db()
    result = db.table("community_niches").insert({
        "submitted_by": x_user_id,
        **data.model_dump(),
    }).execute()
    return result.data[0] if result.data else {}

@social_router.get("/community-niches")
def get_community_niches(status: str = "analyzed"):
    db = get_db()
    result = db.table("community_niches").select("*, profiles(username, expertise)")\
        .eq("status", status).order("upvotes", desc=True).execute()
    return result.data

@social_router.post("/community-niches/{niche_id}/upvote")
def upvote_community_niche(niche_id: uuid.UUID):
    db = get_db()
    niche = db.table("community_niches").select("upvotes").eq("id", str(niche_id)).single().execute()
    if not niche.data:
        raise HTTPException(404, "Not found")
    db.table("community_niches").update({
        "upvotes": (niche.data["upvotes"] or 0) + 1
    }).eq("id", str(niche_id)).execute()
    return {"ok": True}

def _check_and_notify_match(niche_id: str, user_id: str):
    """If 2+ users are interested in same niche, they could be matched."""
    db = get_db()
    interested = db.table("reactions")\
        .select("user_id")\
        .eq("niche_id", niche_id)\
        .eq("reaction", "interested")\
        .execute()
    # For MVP: just log the match opportunity
    # Production: send email/notification via Resend
    if interested.data and len(interested.data) >= 2:
        print(f"[Match] {len(interested.data)} users interested in niche {niche_id}")


# Re-export both under different prefixes in main.py
router = users_router  # users.router
