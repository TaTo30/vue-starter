const BASE_URL = "https://api.crossref.org/"

export default function useCrossrefApi() { 
  function url(resource: "works", searchParams?: URLSearchParams): string {

    const urlIntance = new URL(resource, BASE_URL);

    if (searchParams) {
      urlIntance.search = searchParams.toString();
    }

    return urlIntance.toString();
  }

  return {
    url,
    defaultSelect: "author,ISBN,container-title,URL,title,type,published",
    defaultFacet: "type-name:*,published:*",
    defaultRows: "20"
  }
}