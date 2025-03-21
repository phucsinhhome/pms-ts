import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, FileInput, Label, Modal, Textarea, TextInput, ToggleSwitch } from "flowbite-react";
import { adjustQuantity as adjustInventoryQuantity, changeItemStatus, listProductItems, listProductItemsByGroup, listProductItemsWithName, listProductItemsWithNameAndGroup } from "../db/inventory";
import { HiOutlineCash, HiX } from "react-icons/hi";
import { formatMoneyAmount, formatVND } from "../Service/Utils";
import { DEFAULT_PAGE_SIZE } from "../App";
import { Pagination } from "./ProfitReport";
import { listAllPGroups } from "../db/pgroup";
import { PGroup } from "./PGroupManager";
import { putObject } from "../Service/FileMinio";
import { saveProduct } from "../db/product";

export type Product = {
  id: string,
  name: string,
  unitPrice: number,
  quantity: number,
  group: string,
  description: string,
  featureImgUrl: string,
  imageUrls: string[],
  prepareTime: string,
  status: string,
  availableFrom: string,
  availableTo: string
}

export type ItemAdjustment = {
  itemId: string,
  delta: number,
  quantity: number
}

export type ItemStatusChange = {
  itemId: string,
  status: string
}

const timeOpts = ['PT5M', 'PT15M', 'PT30M', 'PT45M', 'PT1H', 'PT1H15M', 'PT1H30M', 'PT2H']

type InventoryProps = {
  activeMenu: any
}

export const Inventory = (props: InventoryProps) => {


  const bucket = process.env.REACT_APP_PUBLIC_BUCKET!
  const defaultImageKey = "product/images/pizza.png"
  const [filteredName, setFilteredName] = useState('')
  const [products, setProducts] = useState<Product[]>([])

  const [pGroups, setPGroups] = useState<PGroup[]>([])
  const [activeGroup, setActiveGroup] = useState('')
  const [switch1, setSwitch1] = useState(false);

  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
    totalElements: 0
  })

  const buildImageUrl = (objectKey: string) => {
    return `https://${process.env.REACT_APP_FILE_SERVICE_ENDPOINT}/os/${bucket}/${objectKey}`
  }

  const defaultEmptyProduct = {
    id: '',
    name: '',
    quantity: 0,
    unitPrice: 0,
    group: 'food',
    description: '',
    featureImgUrl: buildImageUrl(defaultImageKey),
    imageUrls: [buildImageUrl(defaultImageKey)],
    prepareTime: 'PT1H',
    status: 'DISABLED',
    availableFrom: '08:00',
    availableTo: '22:00'
  }
  const defaultEditingProduct = {
    origin: defaultEmptyProduct,
    formattedUnitPrice: '',
    availableFromLocalTime: '',
    availableToLocalTime: ''
  }

  const [showProductDetailModal, setShowProductDetailModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<{
    origin: Product,
    formattedUnitPrice: string
  }>(defaultEditingProduct)

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

    listProductItems(pagination.pageNumber, pagination.pageSize)
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

    fetchPGroups()

    // eslint-disable-next-line
  }, []);

  useEffect(() => {

    filterProducts()
    props.activeMenu()

    // eslint-disable-next-line
  }, [pagination.pageNumber]);

  useEffect(() => {

    filterProducts();

    // eslint-disable-next-line
  }, [filteredName, activeGroup]);

  const fetchPGroups = () => {
    listAllPGroups()
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setPGroups(data.content)
            })
        }
      })
  }


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

    var item: ItemAdjustment = {
      itemId: product.id,
      delta: delta,
      quantity: product.quantity
    }
    adjustInventoryQuantity(item)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data: ItemAdjustment) => {
              setProducts(products.map(p => {
                if (p.id === data.itemId) { p.quantity = data.quantity }
                return p
              }))
              console.info("Change item %s with quantity %s order successfully", item.itemId, item.quantity)
            })
        } else if (rsp.status === 400) {
          console.warn('The item %s does not exist', item.itemId)
        } else if (rsp.status === 304) {
          console.warn('The item %s ran out', item.itemId)
        }
      })
  }

  const indexProduct = (products: Product[]) => {
    setProducts(products)
  }


  const addProduct = () => {
    setEditingProduct(defaultEditingProduct)
    setShowProductDetailModal(true)
  }

  const activateGroup = (group: string) => {
    if (pagination.pageNumber !== 0) {
      setPagination({
        ...pagination,
        pageNumber: 0
      })
    }
    setActiveGroup(activeGroup !== group ? group : '')
  }

  const activeGroupStyle = (group: string) => {
    return activeGroup === group ?
      'font font-mono text-sm font-bold text-nowrap text-gray-500 border rounded-sm px-1 py-1 bg-slate-400'
      : 'font font-mono text-sm font-bold text-nowrap text-gray-500 border rounded-sm px-1 py-1 bg-slate-50'
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

  const changePrepareTime = (pT: string) => {
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        prepareTime: pT
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
              // fetchAllProducts()

              setProducts(prevProducts => {
                const existingProductIndex = prevProducts.findIndex(p => p.id === data.id);
                if (existingProductIndex > -1) {
                  // If product exists, update it
                  const updatedProducts = [...prevProducts];
                  updatedProducts[existingProductIndex] = data;
                  return updatedProducts;
                } else {
                  // If product doesn't exist, add it
                  return [...prevProducts, data];
                }
              })
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
    if (pagination.pageNumber !== 0) {
      setPagination({
        ...pagination,
        pageNumber: 0
      })
    }
    let fN = e.target.value
    setFilteredName(fN)
  }

  const filterProducts = () => {
    if (filteredName === '' && activeGroup === '') {
      fetchAllProducts()
      return
    }
    if (filteredName === '' && activeGroup !== '') {
      listProductItemsByGroup(activeGroup, pagination.pageNumber, pagination.pageSize)
        .then(rsp => {
          if (rsp.ok) {
            rsp.json()
              .then(data => {
                indexProduct(data.content)
                if (pagination.totalPages !== data.totalPages) {
                  setPagination({
                    ...pagination,
                    totalPages: data.totalPages
                  })
                }
              })
              .catch(() => setProducts([]))
          }
        }).catch(() => {
          setProducts([])
        })
      return
    }

    if (filteredName !== '' && activeGroup === '') {
      listProductItemsWithName(filteredName)
        .then(rsp => {
          if (rsp.ok) {
            rsp.json()
              .then((data) => {
                indexProduct(data.content)
                if (pagination.totalPages > 1) {
                  setPagination({
                    ...pagination,
                    totalPages: 1
                  })
                }
              }).catch(() => setProducts([]))
          }
        }).catch(() => {
          setProducts([])
        })
      return
    }

    listProductItemsWithNameAndGroup(filteredName, activeGroup, pagination.pageNumber, pagination.pageSize)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              indexProduct(data.content)
              if (pagination.totalPages !== data.totalPages) {
                setPagination({
                  ...pagination,
                  totalPages: data.totalPages
                })
              }
            })
            .catch(() => setProducts([]))
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
      ?.then(data => {
        if (data === null) {
          return
        }
        setEditingProduct({
          ...editingProduct,
          origin: {
            ...editingProduct.origin,
            featureImgUrl: data?.objectURL
          }
        })
      })
  }

  const changeContentImage = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
    onFileChange(e, 'content_' + idx)
      ?.then(data => {
        if (data === null) {
          return
        }
        setEditingProduct({
          ...editingProduct,
          origin: {
            ...editingProduct.origin,
            imageUrls: [
              ...editingProduct.origin.imageUrls,
              data.objectURL
            ]
          }
        })
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

  const changeAvailableFrom = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let v = e.target.value;
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        availableFrom: v
      }
    };
    setEditingProduct(eI);
  };
  const changeAvailableTo = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let v = e.target.value;
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        availableTo: v
      }
    };
    setEditingProduct(eI);
  };
  const changeStatus = (status: string): void => {
    let eI = {
      ...editingProduct,
      origin: {
        ...editingProduct.origin,
        status: status
      }
    };
    console.info("Change status to %s", status)
    setEditingProduct(eI);
  }

  const changeProductStatus = (product: Product, status: string): void => {
    let statusChange: ItemStatusChange = {
      itemId: product.id,
      status: status
    }
    changeItemStatus(statusChange)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data) => {
              console.info("Change status of product %s to %s successfully", product.id, status)
              setProducts(products.map(p => {
                if (p.id === data.itemId) {
                  p.status = data.status
                }
                return p
              }))
            })
        }
      })
  }

  return (
    <div className="px-2 h-full pt-3 relative">

      <div className="flex flex-row px-0.5 py-2 space-x-3">
        <Button onClick={addProduct}>Add</Button>
        <div className="flex flex-row items-center space-x-2 overflow-scroll">
          {
            pGroups.map((group) => <Label key={group.groupId} onClick={() => activateGroup(group.name)}
              className={activeGroupStyle(group.name)}
            >{group.displayName}</Label>)
          }
        </div>
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
      <div>
        <div className="flex flex-col space-y-1">
          {products.map((product) => {
            return (
              <div
                className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 relative"
                key={product.id}
              >
                <div className="pl-0.5 pr-1 py-2">
                  <Avatar img={product.featureImgUrl} alt="dish image" rounded className="w-12" />
                </div>
                <div className={product.status === "ENABLED" ? "px-0 w-full" : "px-0 w-full opacity-55"}>
                  <div className="grid grid-cols-1">
                    <div className="flex flex-row">
                      <Link
                        to=''
                        onClick={() => viewProductDetail(product)}
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-green-800 hover:underline dark:text-gray-200 overflow-hidden"
                      >
                        {product.name}
                      </Link>
                    </div>
                    <div className="flex flex-row text-sm space-x-1">
                      <span className="font font-mono text-gray-500 text-[10px]">{product.prepareTime}</span>
                      <span className="font font-mono text-gray-500 text-[10px]">{formatVND(product.unitPrice)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row w-36 px-0 bg-slate-50 shadow-md absolute right-1 bottom-0 space-x-2 py-1">
                  <div className="flex flex-row items-start">
                    <ToggleSwitch
                      id="status"
                      checked={product.status === "ENABLED"}
                      onChange={() => changeProductStatus(product, product.status === "ENABLED" ? "DISABLED" : "ENABLED")}
                      color="green"
                      sizing="sm"
                    />
                  </div>
                  <div className="flex w-full items-center text-center">
                    <button
                      type="button"
                      id="decrement-button"
                      data-input-counter-decrement="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg px-2 h-5 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
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
                      className="bg-gray-50 border-x-0 border-gray-300 w-full min-w-min text-center text-sm text-gray-900 block h-5 py-0.5"
                      placeholder="9"
                      required
                      value={product.quantity}
                      readOnly
                    />
                    <button
                      type="button"
                      id="increment-button"
                      data-input-counter-increment="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg px-2 h-5 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
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
      <div className="flex flex-row items-center justify-between absolute bottom-1">
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
          <div className="flex flex-col space-y-2">
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
            <div className="flex flex-col w-full align-middle border rounded-md px-2 py-1">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="group"
                  value="Group"
                />
              </div>
              <div className="flex flex-row space-x-2 overflow-scroll">
                {
                  pGroups.map((group) => <div
                    key={group.groupId}
                    className={editingProduct.origin.group === group.name ?
                      "border rounded-sm px-1 text-nowrap bg-slate-500" :
                      "border rounded-sm px-1 text-nowrap bg-slate-200"}
                    onClick={() => changeProductGroup(group.name)}>
                    {group.displayName}
                  </div>)
                }
              </div>
            </div>
            <div className="flex flex-col w-full align-middle border rounded-md px-2 py-1">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="prepareTime"
                  value="Prepare Time"
                />
              </div>
              <div className="flex flex-row space-x-2 overflow-scroll">
                {
                  timeOpts.map((pT) => <div
                    key={pT}
                    className={editingProduct.origin.prepareTime === pT ? "border rounded-sm px-1 bg-slate-500" : "border rounded-sm px-1 bg-slate-200"}
                    onClick={() => changePrepareTime(pT)}
                  >{pT.substring(2)}</div>)
                }
              </div>
            </div>
            <div className="flex flex-col w-full align-middle border rounded-md px-2 py-1">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="availbleTime"
                  value="Available Time"
                />
              </div>
              <div className="flex flex-row space-x-1">
                <div className="flex items-center w-1/2">
                  <TextInput
                    id="availbleFrom"
                    placeholder="From"
                    type="time"
                    required={false}
                    className="w-full"
                    value={editingProduct.origin.availableFrom}
                    onChange={changeAvailableFrom}
                  />
                </div>
                <div className="flex items-center w-1/2">
                  <TextInput
                    id="availbleTo"
                    placeholder="To"
                    type="time"
                    required={false}
                    className="w-full"
                    value={editingProduct.origin.availableTo}
                    onChange={changeAvailableTo}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full align-middle px-2 py-1">
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
            <div className="flex flex-col border rounded-md px-2">
              <div className="flex flex-col w-full">
                <Label value="Photos" />
                <span className="text-[9px] font-mono italic text-gray-300">Choose the photo to change</span>
              </div>
              <div className="flex flex-row w-full space-x-2 py-1">
                <div className="w-1/5">
                  <Label
                    htmlFor="featureImgUrl"
                  >
                    <img className="max-w-sm h-12"
                      src={editingProduct.origin.featureImgUrl}
                      alt="" />
                    <FileInput
                      id="featureImgUrl"
                      onChange={(e) => changeFeatureImage(e)}
                      disabled={editingProduct.origin.name === undefined || editingProduct.origin.name === null || editingProduct.origin.name === ''}
                      sizing="sm"
                      className="hidden"
                    />
                  </Label>
                </div>
                {
                  editingProduct.origin.imageUrls ? editingProduct.origin.imageUrls.map((imgUrl, idx) =>
                    <div className="w-1/5">
                      <Label
                        htmlFor={"imgUrl" + idx}
                      >
                        <img className="max-w-sm h-12"
                          src={editingProduct.origin.imageUrls[idx]}
                          alt="" />
                        <FileInput
                          id={"imgUrl" + idx}
                          onChange={(e) => changeContentImage(e, idx)}
                          disabled={editingProduct.origin.name === undefined || editingProduct.origin.name === null || editingProduct.origin.name === ''}
                          className="hidden"
                        />
                      </Label>
                    </div>)
                    : <></>
                }

              </div>
            </div>

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
