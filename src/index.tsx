import {List} from "@raycast/api";
import {useEffect, useState} from "react";
import {searchIssues} from "./issue";
import {ResultItem} from "./types";

export default function Command() {
  const [query, setQuery] = useState<string>("")
  const [items, setItems] = useState<ResultItem[]>([])

  const onSearchChange = (newSearch: string) => setQuery(newSearch)

  useEffect(() => {
    searchIssues(query).then(resultItems => setItems(resultItems))
  }, [query])

  return (
    <List
      throttle
      onSearchTextChange={onSearchChange}
    >
      {items.map(item => <List.Item
          key={item.id}
          icon={item.iconPath}
          title={item.title}
          subtitle={item.subtitle}
          accessoryTitle={item.accessory}
      />)}
    </List>
  );
}