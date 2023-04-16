import axios from "axios";
import getTopicContent from './getTopicContent';
import topicRow from './topicRow';

const maxMoreTopics = 5;
let cnt = 0;

const processTopic = async (topicList, discourseUrl) => {
    const contentPromises = topicList.map((topic) => getTopicContent(discourseUrl, topic));
    const content = await Promise.all(contentPromises);
    const contentSum = content.join("");

    const rowPromises = topicList.map((topic) => topicRow(discourseUrl, topic));
    const topicRows = await Promise.all(rowPromises);
    const topicSUm = topicRows.join("");

    return contentSum + topicSUm;
}

async function mainAction(discourseUrl) {
    const topicPath = "/latest.json?no_definitions=true&page=";
    const baseTopicUrl = discourseUrl + topicPath;
    let url = baseTopicUrl + cnt.toString();
    console.log("🚀 ~ file: index.ts:14 ~ mainAction ~ url:", url)
    let topicListString = "";
    const response = await axios.get(url);
    const topicList = response.data.topic_list.topics;
    const topicContent = processTopic(topicList, discourseUrl);
    topicListString += topicContent;
    while (response.data.topic_list.hasOwnProperty("more_topics_url") && cnt < maxMoreTopics) {
        console.log(`cnt is ${cnt}\n============`);
        cnt++;
        url = baseTopicUrl + cnt.toString();
        const newResponse = await axios.get(url);
        const newTopicList = newResponse.data.topic_list.topics;
        const topicContent = processTopic(newTopicList.slice(1), discourseUrl);
        topicListString += topicContent;
    }
    return topicListString;
}

export default mainAction;