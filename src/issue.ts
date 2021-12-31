import {jiraFetchObject, jiraUrl} from "./jira";
import {avatarPath} from "./avatar";
import {ResultItem, SearchCommand} from "./command";

interface IssueType {
    name: string,
    iconUrl: string,
}

interface IssueStatus {
    name: string,
    statusCategory: {
        key: string,
    },
}

interface Issue {
    id: string,
    key: string,
    fields: {
        summary: string,
        issuetype: IssueType,
        status: IssueStatus,
    },
}

interface Issues {
    issues: Issue[]
}

const fields = "summary,issuetype,status"

function statusString(status: IssueStatus): string {
    const symbolByStatusCategory: { [P: string]: string } = {
        "new": "○",
        "indeterminate": "◐",
        "done": "●",
    }
    const symbol = symbolByStatusCategory[status.statusCategory.key]
    return `${status.name} ${symbol}`
}

export async function searchIssues(query: string): Promise<ResultItem[]> {
    const jql = query.length > 0 ? `text ~ "${query}" order by lastViewed desc` : "order by lastViewed desc"
    const result = await jiraFetchObject<Issues>("/rest/api/3/search", { jql, fields })
    const mapResult = async (issue: Issue) => ({
        id: issue.id,
        title: issue.fields.summary,
        subtitle: `${issue.key} · ${issue.fields.issuetype.name}`,
        iconPath: await avatarPath(issue.fields.issuetype.iconUrl),
        accessory: statusString(issue.fields.status),
        url: `${jiraUrl}/browse/${issue.key}`,
    })
    return Promise.all(result.issues.map(mapResult))
}

export default function SearchIssueCommand() {
    return SearchCommand(searchIssues)
}