
const BASE_URL = "https://api.crossref.org/"


export default function useCrossrefApi() { 

  function getBaseUrl(resource: string = ""): URL {
    return new URL(resource, BASE_URL);
  }





  return {
    getBaseUrl
  }
}