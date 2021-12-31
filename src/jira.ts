import {getPreferenceValues} from "@raycast/api"
import fetch, {Response} from "node-fetch"

const prefs: { domain: string, user: string, token: string } = getPreferenceValues()
export const jiraUrl = `https://${prefs.domain}`

const headers = {
    "Accept": "application/json",
    "Authorization": "Basic " + Buffer.from(`${prefs.user}:${prefs.token}`).toString('base64')
}
const init = {
    headers
}

type QueryParams = { [key: string]: string }

export async function jiraFetchObject<Result>(path: string, params: QueryParams): Promise<Result> {
    const response = await jiraFetch(path, params)
    return await response.json() as unknown as Result
}

export async function jiraFetch(path: string, params: QueryParams): Promise<Response> {
    const paramKeys = Object.keys(params)
    const query = paramKeys.map(key => `${key}=${encodeURI(params[key])}`).join('&')
    return fetch(`${jiraUrl}/${path}?${query}`, init)
}