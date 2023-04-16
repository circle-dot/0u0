import type { NextApiRequest, NextApiResponse } from "next"

import mainAction from "@/lib/discourse"
import axios from "@/lib/axiosInstance"

const maxMoreTopics = 5;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { credentials } = req.body

  const discourseUrl = credentials?.community?.discourseUrl
  // FIXME: Check if credentials match the community ones so there's no injection data
  if (!discourseUrl) {
    res.status(500).json({ error: "No community URL provided." })
  }

  try {
    let cnt = 0;
    const topicPath = "/latest.json?no_definitions=true&page=";
    const baseTopicUrl = discourseUrl + topicPath;
    let url = baseTopicUrl + cnt.toString();

    const topicResponse = await axios.get(url);
    const topicList = topicResponse.data.topic_list.topics;
    await mainAction(topicList, discourseUrl, credentials);
    while (topicResponse.data.topic_list.hasOwnProperty("more_topics_url") && cnt < maxMoreTopics) {
      console.log(`cnt is ${cnt}\n============`);
      cnt++;
      url = baseTopicUrl + cnt.toString();
      const newResponse = await axios.get(url);

      const newTopicList = newResponse.data.topic_list.topics;
      await mainAction(newTopicList.slice(1), discourseUrl, credentials);
    }

    res.status(200).json({})
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error." })
  }
}
