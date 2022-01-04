import {jiraFetchObject, jiraUrl} from "./jira";
import {jiraAvatarImage} from "./avatar";
import {ResultItem, SearchCommand} from "./command";
import {Color, ColorLike, Icon, Image, ImageSource} from "@raycast/api";

interface IssueType {
    id: string,
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

function statusIcon(status: IssueStatus): Image {
    const icon = (source: ImageSource, tintColor?: ColorLike) => ({ source, tintColor })
    switch (status.statusCategory.key) {
        case "done": return icon(Icon.Checkmark, Color.Green)
        case "indeterminate": return icon(Icon.ArrowClockwise, Color.Blue)
        default: return icon(Icon.Circle)
    }
}

function isIssueKey(query: string): boolean {
    const issueKeyPattern = /^[a-z]+-[0-9]+$/i
    return query.match(issueKeyPattern) !== null
}

function buildJql(query: string): string {
    const spaceAndInvalidChars = /[ "]/
    const terms = query.split(spaceAndInvalidChars).filter(term => term.length > 0)

    const collectPrefixed = (prefix: string, terms: string[]): string[] => terms
        .filter(term => term.startsWith(prefix) && term.length > prefix.length)
        .map(term => term.substring(prefix.length))
    const projects = collectPrefixed("@", terms)
    const issueTypes = collectPrefixed("#", terms)
    const unwantedTextTermChars = /[-+!]/
    const textTerms = terms
        .filter(term => !"@#".includes(term[0]))
        .flatMap(term => term.split(unwantedTextTermChars))

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

function jqlFor(query: string): string {
    return isIssueKey(query) ? `key=${query}` : buildJql(query)
}

export async function searchIssues(query: string): Promise<ResultItem[]> {
    const jql = jqlFor(query)
    console.debug(jql)
    const result = await jiraFetchObject<Issues>("/rest/api/3/search", { jql, fields })
    const mapResult = async (issue: Issue): Promise<ResultItem> => ({
        id: issue.id,
        title: issue.fields.summary,
        subtitle: `${issue.key} · ${issue.fields.issuetype.name}`,
        icon: await jiraAvatarImage(issue.fields.issuetype.iconUrl),
        accessoryIcon: statusIcon(issue.fields.status),
        accessoryTitle: issue.fields.status.name,
        url: `${jiraUrl}/browse/${issue.key}`,
    })
    return result.issues && result.issues.length > 0 ? Promise.all(result.issues.map(mapResult)) : []
}

export default function SearchIssueCommand() {
    return SearchCommand(searchIssues, "Search issues by text, @project and #issueType")
}