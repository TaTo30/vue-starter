export default function useCrossrefFilters() { 
  function formatFilterValue(facet: string, value: string): string[][] { 
    switch (facet) { 
      case "published":
        return [["from-pub-date", value], ["until-pub-date", value]]
      default:
        return [[facet, value]]
    }
  }

  function getFacetKey(filterKey: string): string {
    switch (filterKey) { 
      case "from-pub-date":
      case "until-pub-date":
        return "published"
      default:
        return filterKey
    }
  }

  function singleSelection(facet: string): boolean {
    switch (facet) {
      case "published":
        return true
      default:
        return false
    }
  }

  return {
    formatFilterValue,
    getFacetKey,
    singleSelection
  }
}