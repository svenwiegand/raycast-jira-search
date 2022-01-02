import path from "path";
import {environment, ImageLike, showToast, ToastStyle} from "@raycast/api";
import {promises as fs} from "fs";
import {jiraFetch} from "./jira";

interface AvatarSpec {
    type: string,
    id: string,
}

const avatarDir = path.join(environment.supportPath, "avatar")

async function isFile(path: string): Promise<boolean> {
    try {
        const stat = await fs.stat(path)
        return stat.isFile()
    } catch (err) {
        return false
    }
}

function filePath(avatar: AvatarSpec): string {
    return path.join(avatarDir, avatar.type, `${avatar.id}.png`)
}

async function downloadAvatar(avatar: AvatarSpec, filePath: string): Promise<string> {
    const urlPath = `rest/api/3/universal_avatar/view/type/${avatar.type}/avatar/${avatar.id}`
    const { dir } = path.parse(filePath)
    await fs.mkdir(dir, { recursive: true })
    const response = await jiraFetch(urlPath, { size: "medium", format: "png" })
    const body = await response.arrayBuffer()
    await fs.writeFile(filePath, new DataView(body))
    return filePath
}

function parseAvatarUrl(url: string): AvatarSpec | null {
    const pattern = /.*\/universal_avatar\/view\/type\/([a-z]+)\/avatar\/([0-9]+)/
    const match = url.match(pattern)
    return match ? { type: match[1], id: match[2] } : null
}

export async function jiraAvatarImage(url: string): Promise<ImageLike | undefined> {
    const avatar = parseAvatarUrl(url)
    if (avatar) {
        const path = filePath(avatar)
        const isAvailable = await isFile(path)
        return isAvailable ? path : downloadAvatar(avatar, path)
    } else {
        return undefined
    }
}

export default async function ClearAvatarCache() {
    await fs.rm(avatarDir, { force: true, recursive: true })
    showToast(ToastStyle.Success, "Reload Icons", "Icons successfully reloaded")
}