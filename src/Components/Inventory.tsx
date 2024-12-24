import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, Dropdown, FileInput, Label, Modal, Textarea, TextInput } from "flowbite-react";
import { adjustQuantity as adjustInventoryQuantity, listProducts, listProductsWithName, saveProduct } from "../db/product";
import { HiOutlineCash, HiX } from "react-icons/hi";
import { formatMoneyAmount, formatVND } from "../Service/Utils";
import { putObject } from "../db/gcs";
import { DEFAULT_PAGE_SIZE } from "../App";
import { Pagination } from "./ProfitReport";

export type Product = {
  id: string,
  name: string,
  unitPrice: number,
  quantity: number,
  group: string,
  description: string,
  featureImgUrl: string,
  imageUrls: string[]
}

type InventoryProps = {
  activeMenu: any
}
export const GOOGLE_CLOUD_STORAGE = 'https://storage.googleapis.com'

export const Inventory = (props: InventoryProps) => {

  
  const defaultImageKey = "psassistant/product/pizza.png"
  const [filteredName, setFilteredName] = useState('')
  const [products, setProducts] = useState<Product[]>([])

  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
    totalElements: 0
  })

  const buildImageUrl = (objectKey: string) => {
    return [GOOGLE_CLOUD_STORAGE, process.env.REACT_APP_PUBLIC_BUCKET, objectKey].join("/")
  }

  const defaultEmptyProduct = {
    id: '',
    name: '',
    quantity: 0,
    unitPrice: 0,
    group: '',
    description: '',
    featureImgUrl: buildImageUrl(defaultImageKey),
    imageUrls: [buildImageUrl(defaultImageKey)]
  }
  const defaultEditingProduct = {
    origin: defaultEmptyProduct,
    formattedUnitPrice: ''
  }

  const [showProductDetailModal, setShowProductDetailModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<{ origin: Product, formattedUnitPrice: string }>(defaultEditingProduct)

  const handlePaginationClick = (page: number) => {
    console.log("Pagination nav bar click to page %s", page)

    var pNum = page < 0 ? 0 : page > pagination.totalPages - 1 ? pagination.totalPages - 1 : page
    setPagination({
      ...pagination,
      pageNumber: pNum
    })
  }

  const fetchAllProducts = () => {
    console.info("Loading all the products")

    listProducts(pagination.pageNumber, pagination.pageSize)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              indexProduct(data.content)
              if (data.totalPages !== pagination.totalPages) {
                setPagination({
                  ...pagination,
                  totalPages: data.totalPages
                })
              }
            })
        }
      })
  }

  useEffect(() => {

    fetchAllProducts();
    props.activeMenu()

    // eslint-disable-next-line
  }, [location, pagination.pageNumber]);


  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  //================ ORDER ==========================//

  const changeQuantity = (product: Product, delta: number) => {

    if (delta <= 0 && product.quantity <= 0) {
      return
    }

    var item = {
      ...product,
      quantity: product.quantity + delta
    }
    adjustInventoryQuantity(item)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data: Product) => {
              setProducts(products.map(p => {
                if (p.id === data.id) { p.quantity = data.quantity }
                return p
              }))
              console.info("Change item %s with quantity %s order successfully", item.id, item.quantity)
            })
        } else if (rsp.status === 400) {
          console.warn('The item %s does not exist', item.id)
        } else if (rsp.status === 304) {
          console.warn('The item %s ran out', item.id)
        }
      })
  }

  const indexProduct = (fProducts: Product[]) => {
    // var iP = fProducts.reduce((map, product) => { map[product.id] = product; return map }, {})
    setProducts(fProducts)
  }


  const addProduct = () => {
    setEditingProduct(defaultEditingProduct)
    setShowProductDetailModal(true)
  }

  const viewProductDetail = (product: Product) => {
    let uP = formatMoneyAmount(product.unitPrice + '')
    let eP = {
      origin: product,
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingProduct(eP)
    setShowProductDetailModal(true)
  }

  const closeProductDetailModal = () => {
    setShowProductDetailModal(false)
    setEditingProduct(defaultEditingProduct)
  }

  const changeProductName = (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        name: v
      }
    }
    setEditingProduct(eI)
  }
  const emptyProductName = () => {
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        name: ''
      }
    }
    setEditingProduct(eI)
  }

  const changeProductUnitPrice = (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value
    let uP = formatMoneyAmount(v)
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        unitPrice: uP.amount
      },
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingProduct(eI)
  }

  const changeProductQuantity = (delta: number) => {
    if (delta <= 0 && editingProduct.origin.quantity <= 0) {
      return
    }
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        quantity: editingProduct.origin.quantity + delta
      }
    }
    setEditingProduct(eI)
  }

  const changeProductDescription = (e: ChangeEvent<HTMLTextAreaElement>) => {
    let v = e.target.value
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        description: v
      }
    }
    setEditingProduct(eI)
  }

  const changeProductGroup = (gN: string) => {
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        group: gN
      }
    }
    setEditingProduct(eI)
  }

  const createOrUpdateProduct = () => {
    if (editingProduct.origin.name === '') {
      console.warn("Invalid product name")
      return
    }
    saveProduct(editingProduct.origin)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data) => {
              console.info("Save product successfully with id %s and offset %d", data.id, data.displayOffset)
              setEditingProduct(defaultEditingProduct)
              fetchAllProducts()
            })
        }
      }).finally(() => {
        setShowProductDetailModal(false)
      })
  }

  const cancelEditingProduct = () => {
    setShowProductDetailModal(false)
    setEditingProduct(defaultEditingProduct)
  }

  const changeFilteredName = (e: ChangeEvent<HTMLInputElement>) => {
    let fN = e.target.value
    setFilteredName(fN)

    if (fN === null || fN === '') {
      fetchAllProducts()
      return
    }

    listProductsWithName(fN)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              indexProduct(data)
            }).catch(() => setProducts([]))
        }
      }).catch(() => {
        setProducts([])
      })
  }

  const emptyFilterText = () => {
    setFilteredName('')
    fetchAllProducts()
  }

  const changeFeatureImage = (e: ChangeEvent<HTMLInputElement>) => {
    onFileChange(e, 'feature')
      ?.then((rsp: Response) => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setEditingProduct({
                ...editingProduct,
                origin: {
                  ...editingProduct.origin,
                  featureImgUrl: buildImageUrl(data.objectKey)
                }
              })
            })
        }
      })
  }

  const changeContentImage = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
    onFileChange(e, 'content_' + idx)
      ?.then((rsp: Response) => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setEditingProduct({
                ...editingProduct,
                origin: {
                  ...editingProduct.origin,
                  imageUrls: [
                    buildImageUrl(data.objectKey)
                  ]
                }
              })
            })
        }
      })
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>, nameSuffix: string) => {
    let upload = e.target.files;
    if (upload === null) {
      console.warn("Invalid choosen files")
      return
    }
    if (upload.length < 1) return;
    const file = upload[0];


    const fullName = file.name;
    var extension = ''

    const lastDotIndex = fullName.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      extension = fullName.slice(lastDotIndex + 1);
    }
    var imageName = editingProduct.origin.name.toLowerCase().replace(' ', '_') + '_' + nameSuffix + '.' + extension

    let imageKey = ['product/images', editingProduct.origin.group, imageName].join('/')
    console.info("The new image name has been generated %s", imageKey)

    return putObject(file, imageName, process.env.REACT_APP_PUBLIC_BUCKET!, imageKey)
  }

  return (
    <div className="px-2 h-full pt-3">

      <div className="px-0.5 py-2">
        <Button onClick={addProduct}>Add</Button>
      </div>
      <div className="pb-2">
        <TextInput
          id="filteredName"
          placeholder="Enter product name to search"
          type="text"
          required={true}
          value={filteredName}
          onChange={changeFilteredName}
          className="w-full"
          rightIcon={() => <HiX onClick={emptyFilterText} />}
        />
      </div>
      <div className="max-h-fit overflow-hidden">
        <div className="flex flex-col space-y-1">
          {products.map((product) => {
            return (
              <div
                className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 "
                key={product.id}
              >
                <div className="pl-0.5 pr-1">
                  <Avatar img={product.featureImgUrl} alt="dish image" rounded className="w-12" />
                </div>
                <div className="px-0 w-full">
                  <div className="grid grid-cols-1">
                    <div className="flex flex-row">
                      <Link
                        to=''
                        onClick={() => viewProductDetail(product)}
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500 overflow-hidden"
                      >
                        {product.name}
                      </Link>
                    </div>
                    <div className="flex flex-row text-sm space-x-1">
                      <span className="font font-mono text-gray-500 text-[10px]">{product.description}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col pl-0.2 pr-2">
                  <div>
                    <span className="w-full text text-center font-mono text-red-700 font-semibold">{formatVND(product.unitPrice)}</span>
                  </div>
                  <div className="relative flex items-center w-full mb-2">
                    <button
                      type="button"
                      id="decrement-button"
                      data-input-counter-decrement="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                      onClick={() => changeQuantity(product, -1)}
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      id="quantity-input"
                      data-input-counter aria-describedby="helper-text-explanation"
                      className="bg-gray-50 border-x-0 border-gray-300 h-7 text-center text-gray-900 focus:ring-blue-500 focus:border-blue-500 block w-11 py-1 pr-0 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="9"
                      required
                      value={product.quantity}
                      readOnly
                    />
                    <button
                      type="button"
                      id="increment-button"
                      data-input-counter-increment="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                      onClick={() => changeQuantity(product, 1)}
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <nav className="flex items-center justify-between pt-2" aria-label="Table navigation">
          <ul className="inline-flex items-center -space-x-px">
            <li onClick={() => handlePaginationClick(pagination.pageNumber - 1)} className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            </li>
            <li onClick={() => handlePaginationClick(0)} className={pageClass(0)}>
              1
            </li>
            <li hidden={pagination.pageNumber + 1 <= 1 || pagination.pageNumber + 1 >= pagination.totalPages} aria-current="page" className={pageClass(pagination.pageNumber)}>
              {pagination.pageNumber + 1}
            </li>
            <li hidden={pagination.totalPages <= 1} onClick={() => handlePaginationClick(pagination.totalPages - 1)} className={pageClass(pagination.totalPages - 1)}>
              {pagination.totalPages}
            </li>
            <li onClick={() => handlePaginationClick(pagination.pageNumber + 1)} className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
            </li>
          </ul>
        </nav>
      </div>


      <Modal
        show={showProductDetailModal}
        popup={true}
        onClose={closeProductDetailModal}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="flex flex-col space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="name"
                  value="Name"
                />
              </div>
              <TextInput
                id="name"
                placeholder="Name to display on menu"
                type="currency"
                step={5000}
                required={true}
                value={editingProduct.origin.name}
                onChange={changeProductName}
                rightIcon={() => <HiX onClick={emptyProductName} />}
                className="w-full"
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="unitPrice"
                  value="Unit Price"
                />
              </div>
              <TextInput
                id="unitPrice"
                placeholder="Price to display on menu"
                type="currency"
                step={5000}
                required={true}
                value={editingProduct.formattedUnitPrice}
                onChange={changeProductUnitPrice}
                rightIcon={HiOutlineCash}
                className="w-full"
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="group"
                  value="Group"
                />
              </div>
              <Dropdown
                id="group"
                label={editingProduct.origin.group}
                inline
                value={editingProduct.origin.group}
                dismissOnClick
              >
                <Dropdown.Item onClick={() => changeProductGroup('food')}>food</Dropdown.Item>
                <Dropdown.Item onClick={() => changeProductGroup('baverage')}>baverage</Dropdown.Item>
                <Dropdown.Item onClick={() => changeProductGroup('breakfast')}>breakfast</Dropdown.Item>
              </Dropdown>
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="quantity"
                  value="Quantity"
                />
              </div>
              <div className="relative flex items-center w-full">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => changeProductQuantity(-1)}
                >
                  <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                  </svg>
                </button>
                <input
                  type="number"
                  id="quantity-input"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="1"
                  required
                  value={editingProduct.origin.quantity}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => changeProductQuantity(1)}
                >
                  <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="description"
                  value="Description"
                />
              </div>
              <Textarea
                id="description"
                placeholder="Vegiterian"
                required={false}
                value={editingProduct.origin.description}
                onChange={changeProductDescription}
                className="w-full"
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="featureImgUrl"
                  value="Feature Image"
                />
              </div>
              <FileInput id="featureImgUrl" onChange={(e) => changeFeatureImage(e)} disabled={editingProduct.origin.name === undefined || editingProduct.origin.name === null || editingProduct.origin.name === ''} />
              <img className="max-w-sm h-12"
                src={editingProduct.origin.featureImgUrl}
                alt="" />
            </div>
            {
              editingProduct.origin.imageUrls ? editingProduct.origin.imageUrls.map((imgUrl, idx) => <div key={idx} className="flex flex-row w-full align-middle">
                <div className="flex items-center w-2/5">
                  <Label
                    htmlFor={"imgUrl" + idx}
                    value={"Img " + idx}
                  />
                </div>
                <FileInput id={"imgUrl" + idx} onChange={(e) => changeContentImage(e, idx)} disabled={editingProduct.origin.name === undefined || editingProduct.origin.name === null || editingProduct.origin.name === ''} />
                <img className="max-w-sm h-12"
                  src={editingProduct.origin.imageUrls[idx]}
                  alt="" />
              </div>)
                : <></>
            }
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center">
          <Button onClick={createOrUpdateProduct} className="mx-2" disabled={editingProduct.origin.name === ''}>
            Save
          </Button>
          <Button onClick={cancelEditingProduct} className="mx-2">
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

    </div >
  );
}
