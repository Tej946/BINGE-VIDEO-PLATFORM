import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000/api/v1"

def api_call(path, method="GET", payload=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    headers = {"Content-Type": "application/json"} if payload else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_spaces_test_suite():
    print("=== STARTING BINGE SPACES TEST SUITE ===", flush=True)

    # 1. Test Create Space
    print("\n1. Testing Create Space...", flush=True)
    new_space_data = {
        "name": "Sci-Fi & Cyberpunk",
        "icon": "🚀",
        "color": "#FF0055",
        "description": "Futuristic films, neon aesthetics, and synthwave."
    }
    created_space = api_call("/spaces", method="POST", payload=new_space_data)
    space_id = created_space["id"]
    space_slug = created_space["slug"]
    print(f"   [PASS] Space created: id={space_id}, slug={space_slug}, name='{created_space['name']}', icon='{created_space['icon']}', color='{created_space['color']}'", flush=True)
    assert created_space["name"] == "Sci-Fi & Cyberpunk"
    assert created_space["icon"] == "🚀"
    assert created_space["color"] == "#FF0055"

    # 2. Test Edit Space
    print("\n2. Testing Edit Space...", flush=True)
    update_data = {
        "name": "Cyberpunk & Deep Sci-Fi",
        "icon": "🌌",
        "color": "#9D4EDD",
        "description": "Deep synthwave, neon cities, and speculative fiction."
    }
    updated_space = api_call(f"/spaces/{space_id}", method="PUT", payload=update_data)
    print(f"   [PASS] Space updated: name='{updated_space['name']}', icon='{updated_space['icon']}', color='{updated_space['color']}'", flush=True)
    assert updated_space["name"] == "Cyberpunk & Deep Sci-Fi"
    assert updated_space["icon"] == "🌌"
    assert updated_space["color"] == "#9D4EDD"

    # 3. Test Add Local Video to Space
    print("\n3. Testing Add Local Video to Space...", flush=True)
    videos = api_call("/videos")
    local_vids = [v for v in videos if v.get("source") == "local"]
    local_vid = local_vids[0] if local_vids else videos[0]
    local_vid_id = local_vid["id"]
    add_local_res = api_call(f"/spaces/{space_id}/videos", method="POST", payload={"video_id": local_vid_id})
    local_space_names = [s["name"] if isinstance(s, dict) else s for s in add_local_res["spaces"]]
    print(f"   [PASS] Added local video '{local_vid['title']}' (id={local_vid_id}) to space: {local_space_names}", flush=True)
    assert updated_space["name"] in local_space_names

    # 4. Test Add External YouTube Video to Space
    print("\n4. Testing Add External YouTube Video to Space...", flush=True)
    yt_payload = {
        "title": "BTS (방탄소년단) 'Dynamite' Official MV",
        "video_path": "https://www.youtube.com/watch?v=gdZLi9oWNZg",
        "thumbnail_path": "https://i.ytimg.com/vi/gdZLi9oWNZg/hqdefault.jpg",
        "duration": 224,
        "creator_name": "HYBE LABELS",
        "description": "BTS Official Music Video",
        "source": "youtube",
        "external_id": "gdZLi9oWNZg",
        "playback_type": "embed",
        "embed_url": "https://www.youtube-nocookie.com/embed/gdZLi9oWNZg"
    }
    add_yt_res = api_call(f"/spaces/{space_id}/videos", method="POST", payload=yt_payload)
    yt_vid_id = add_yt_res["id"]
    yt_space_names = [s["name"] if isinstance(s, dict) else s for s in add_yt_res["spaces"]]
    print(f"   [PASS] Added YouTube video (id={yt_vid_id}) to space: {yt_space_names}", flush=True)
    assert updated_space["name"] in yt_space_names

    # 5. Test One Video Belonging to Multiple Spaces
    print("\n5. Testing One Video Belonging to Multiple Spaces...", flush=True)
    all_spaces = api_call("/spaces")
    second_space = [s for s in all_spaces if s["id"] != space_id][0]
    second_space_id = second_space["id"]
    multi_res = api_call(f"/spaces/{second_space_id}/videos", method="POST", payload={"video_id": yt_vid_id})
    multi_space_names = [s["name"] if isinstance(s, dict) else s for s in multi_res["spaces"]]
    print(f"   [PASS] Video {yt_vid_id} now in spaces: {multi_space_names}", flush=True)
    assert updated_space["name"] in multi_space_names
    assert second_space["name"] in multi_space_names

    # 6. Test Fetch Space Videos
    print("\n6. Testing Fetch Space Videos...", flush=True)
    space_videos = api_call(f"/spaces/{space_id}/videos")
    titles = [v["title"] for v in space_videos]
    print(f"   [PASS] Space '{updated_space['name']}' has {len(space_videos)} videos: {titles}", flush=True)
    assert len(space_videos) == 2

    # 7. Test Remove Video from Space Without Deleting the Video
    print("\n7. Testing Remove Video from Space...", flush=True)
    remove_res = api_call(f"/spaces/{space_id}/videos/{yt_vid_id}", method="DELETE")
    print(f"   [PASS] Removed video from space: {remove_res['message']}", flush=True)
    
    # Check space videos again
    remaining_space_videos = api_call(f"/spaces/{space_id}/videos")
    print(f"   [PASS] Space now has {len(remaining_space_videos)} video(s)", flush=True)
    assert len(remaining_space_videos) == 1

    # Verify the video itself STILL EXISTS in the database and still belongs to second_space
    yt_check = api_call(f"/videos/{yt_vid_id}")
    yt_check_ids = [s["id"] if isinstance(s, dict) else s for s in yt_check["spaces"]]
    yt_check_names = [s["name"] if isinstance(s, dict) else s for s in yt_check["spaces"]]
    print(f"   [PASS] Video {yt_vid_id} still exists in system! Remaining spaces: {yt_check_names}", flush=True)
    assert second_space["id"] in yt_check_ids
    assert updated_space["id"] not in yt_check_ids

    # 8. Test Delete Space and Ensure Videos are NOT Deleted
    print("\n8. Testing Delete Space...", flush=True)
    del_res = api_call(f"/spaces/{space_id}", method="DELETE")
    print(f"   [PASS] Space deleted: {del_res['message']}", flush=True)

    # Verify local video still exists
    local_check = api_call(f"/videos/{local_vid_id}")
    print(f"   [PASS] Local video {local_vid_id} ('{local_check['title']}') still exists!", flush=True)
    assert local_check["id"] == local_vid_id

    # Verify YouTube video still exists
    yt_check_final = api_call(f"/videos/{yt_vid_id}")
    print(f"   [PASS] YouTube video {yt_vid_id} still exists!", flush=True)
    assert yt_check_final["id"] == yt_vid_id

    print("\n=== ALL BINGE SPACES BACKEND TESTS PASSED SUCCESSFULLY! ===", flush=True)

if __name__ == "__main__":
    run_spaces_test_suite()
