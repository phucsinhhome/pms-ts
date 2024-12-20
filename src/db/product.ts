export const listAllProducts = () => {
  console.info("Fetching all products")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list/like?name=*`, opts)
    .then(response => response.json())
}

export const listProducts = (page:number, size:number) => {
  console.info("Fetching all products from the inventory")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?page=${page}&size=${size}`, opts)
}

export const adjustQuantity = (product) => {
  console.info("Adjust the product")
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/save`, opts)
}

export const saveProduct = (product) => {
  console.info("Save product details")
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/save`, opts)
}

export const listProductsWithName = (name) => {
  console.info("Filter products with name")

  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list/like?name=${name}`, opts)
}