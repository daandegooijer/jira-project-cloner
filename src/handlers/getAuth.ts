export default function getAuth() {
  const baseUrl = process.env.JIRA_BASE_URL;
  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64");

  return { baseUrl, auth };
}
