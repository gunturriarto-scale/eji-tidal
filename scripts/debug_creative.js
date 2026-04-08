
import 'dotenv/config';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const adId = '120241150513150707'; // One of the black Superstar ads from previous check

async function debug() {
    const url = `https://graph.facebook.com/v20.0/${adId}?fields=id,name,effective_status,creative{id,thumbnail_url,image_url,image_hash,video_id,object_story_spec,product_data,object_type,call_to_action_type}&access_token=${META_ACCESS_TOKEN}`;
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Full Creative Data for Ad:", JSON.stringify(data, null, 2));
}

debug();
