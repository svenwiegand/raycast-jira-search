import {jiraFetchObject, jiraUrl} from "./jira";
import {jiraAvatarImage} from "./avatar";
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
    issues?: Issue[]
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

function buildJql(query: string): string {
    const spaceAndInvalidCharacters = /[- +!"]/;
    const terms = query.split(spaceAndInvalidCharacters).filter(term => term.length > 0)

    const collectPrefixed = (prefix: string, terms: string[]): string[] => terms
        .filter(term => term.startsWith(prefix) && term.length > prefix.length)
        .map(term => term.substring(prefix.length))
    const projects = collectPrefixed("@", terms)
    const issueTypes = collectPrefixed("#", terms)
    const textTerms = terms.filter(term => !"@#".includes(term[0]))

    const escapeStr = (str: string) => `"${str}"`
    const inClause = (entity: string, items: string[]) =>
        items.length > 0 ? `${entity} IN (${items.map(escapeStr)})` : undefined
    const jqlConditions = [
        inClause("project", projects),
        inClause("issueType", issueTypes),
        ...textTerms.map(term => `text~"${term}*"`),
    ]

    const jql = jqlConditions.filter(condition => condition !== undefined).join(" AND ")
    return jql + " order by lastViewed desc"
}

export async function searchIssues(query: string): Promise<ResultItem[]> {
    const jql = buildJql(query)
    const result = await jiraFetchObject<Issues>("/rest/api/3/search", { jql, fields })
    const mapResult = async (issue: Issue): Promise<ResultItem> => ({
        id: issue.id,
        title: issue.fields.summary,
        subtitle: `${issue.key} · ${issue.fields.issuetype.name}`,
        icon: await jiraAvatarImage(issue.fields.issuetype.iconUrl),
        accessoryTitle: statusString(issue.fields.status),
        url: `${jiraUrl}/browse/${issue.key}`,
    })
    return result.issues && result.issues.length > 0 ? Promise.all(result.issues.map(mapResult)) : []
}

export default function SearchIssueCommand() {
    return SearchCommand(searchIssues, "Search issues by text, @project and #issueType")
}