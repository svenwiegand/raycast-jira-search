import { ResultItem } from "./types";
import { jiraFetch } from "./api";

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
    const result = await jiraFetch<Issues>("/rest/api/3/search", { jql, fields })
    return result.issues.map(issue => ({
        id: issue.id,
        title: issue.fields.summary,
        subtitle: `${issue.key} · ${issue.fields.issuetype.name}`,
        iconUrl: issue.fields.issuetype.iconUrl,
        accessory: statusString(issue.fields.status),
        url: "",
    }))
}