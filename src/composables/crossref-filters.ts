

export default function useCrossrefFilters() { 


  function formatFilterValue(facet: string, value: string): string[] { 
    switch (facet) { 
      case "published":
        return ["from-pub-date", value]
      default:
        return [facet, value]
    }
  }

  function getFacetKey(filterKey: string): string {
    switch (filterKey) { 
      case "from-pub-date":
        return "published"
      default:
        return filterKey
    }
  }


  return {
    formatFilterValue,
    getFacetKey
  }

}