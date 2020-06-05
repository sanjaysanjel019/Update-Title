const functions = require("firebase-functions");
const axios = require("axios");

const articlesEndpoint = "https://dev.to/api/articles";

// A recursive function that checks if a post
// is present in the current response and returns it.
async function getPost(postId, pageNo = 1) {
    const {
        data
    } = await axios.get(
        `${articlesEndpoint}/me/all?per_page=10&page=${pageNo}`, {
            headers: {
                "api-key": functions.config().dev.api_key,
            },
        }
    );

    const post = data.find((i) => i.id == postId);

    if (!post) {
        return getPost(postId, pageNo + 1);
    }

    return post;
}

// A snippet taken from SO that adds commas to a number.
// https://stackoverflow.com/a/2901298/4698790
function addCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// A function that updates a post title
// to the current views, reactions and comments
// count by its id.
async function updatePost(postId) {
    const {
        page_views_count,
        public_reactions_count,
        comments_count,
    } = await getPost(postId);
    const data = {
        title: `This Post Has ${addCommas(page_views_count)} Views, ${addCommas(
      public_reactions_count
    )} Reactions And ${addCommas(comments_count)} Comments`,
    };
    const res = await axios.put(`${articlesEndpoint}/${postId}`, data, {
        headers: {
            "api-key": functions.config().dev.api_key,
        },
    });
    return res.data;
}

// A function that uses the scheduler and
// pubsub APIs to run a given code every
// 3 minutes.
exports.updatePostTitle = functions.pubsub
    .schedule("every 3 minutes")
    .onRun(() => {
        const postId = functions.config().dev.post_id;
        return updatePost(postId);
    });