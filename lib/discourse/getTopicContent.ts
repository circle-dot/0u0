import axios from "@/lib/axiosInstance"
import { sleep } from "@/lib/utils"

const getTopicContent = async (discourseUrl, topicJson) => {
    const topicDownloadUrl = `${discourseUrl}/t/${topicJson.slug}/${topicJson.id}`;
    const topicRelativeUrl = `t/${topicJson.slug}/${topicJson.id}`;
    try {
        const response = await axios.get(`${topicDownloadUrl}.json`);
        const postsJson = response.data.post_stream.posts;
        await sleep(500)
        return postsJson;
    } catch (err) {
        console.log('in write_topic error:', 'Error fetching topic');
    }
};

export default getTopicContent;
