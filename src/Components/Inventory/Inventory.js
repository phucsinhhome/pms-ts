import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, FileInput, Label, Modal, Textarea, TextInput } from "flowbite-react";
import { adjustQuantity as adjustInventoryQuantity, listProducts, listProductsWithName, saveProduct } from "../../db/product";
import { formatMoneyAmount } from "../Invoice/EditItem";
import { HiOutlineCash } from "react-icons/hi";
import { DEFAULT_PAGE_SIZE } from "../../App";
import { formatVND } from "../../Service/Utils";


export const Inventory = () => {

  const [filteredName, setFilteredName] = useState('')
  const [products, setProducts] = useState({})

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 200,
    totalPages: 20
  })

  const [showProductDetailModal, setShowProductDetailModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState({})

  const handlePaginationClick = (page) => {
    console.log("Pagination nav bar click to page %s", page)

    var pNum = page < 0 ? 0 : page > pagination.totalPages - 1 ? pagination.totalPages - 1 : page;
    var pSize = pagination.pageSize

    var nPage = {
      ...pagination,
      pageNumber: pNum,
      pageSize: pSize
    }
    setPagination(nPage)
    fetchAllProducts()
  }

  const fetchAllProducts = () => {
    console.info("Loading all the products")

    listProducts(pagination.pageNumber, pagination.pageSize)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              indexProduct(data.content)
              setPagination({
                pageNumber: data.number,
                pageSize: data.size,
                totalElements: data.totalElements,
                totalPages: data.totalPages
              })
            })
        }
      })
  }

  useEffect(() => {

    fetchAllProducts();

    // eslint-disable-next-line
  }, [location]);


  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  //================ ORDER ==========================//

  const changeQuantity = (product, delta) => {

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
            .then(data => {
              
              let key = data.id
              // let iP = {
              //   ...products,
              //   [key]: {
              //     ...products[key],
              //     quantity: data.quantity
              //   }
              // }
              // console.log(iP);

              products[key].quantity = data.quantity
              setProducts({...products})
              

              // setProducts(iP)
              console.info("Change item %s with quantity %s order successfully", item.id, item.quantity)
            })
        } else if (rsp.status === 400) {
          console.warn('The item %s does not exist', item.id)
        } else if (rsp.status === 304) {
          console.warn('The item %s ran out', item.id)
        }
      })
  }

  const indexProduct = (fProducts) => {
    var iP = Array.of(fProducts).reduce((map, e) => { map[e.id] = e; return map })
    setProducts(iP)
  }

  const addProduct = () => {
    let aP = {
      id: crypto.randomUUID().toLocaleLowerCase(),
      quantity: 10,
      featureImgUrl: "https://storage.googleapis.com/ps-dc-pub/psassistant/product/pizza.png",
      imageUrls: [
        "https://storage.googleapis.com/ps-dc-pub/psassistant/product/pizza.png"
      ]
    }
    setEditingProduct(aP)
    setShowProductDetailModal(true)
  }

  const viewProductDetail = (product) => {
    let uP = formatMoneyAmount(product.unitPrice + '')
    let eP = {
      ...product,
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingProduct(eP)
    setShowProductDetailModal(true)
  }

  const closeProductDetailModal = () => {
    setShowProductDetailModal(false)
    setEditingProduct({})
  }

  const changeProductName = (e) => {
    let v = e.target.value
    let eI = {
      ...editingProduct,
      name: v
    }
    setEditingProduct(eI)
  }

  const changeProductUnitPrice = (e) => {
    let v = e.target.value
    let uP = formatMoneyAmount(v)
    let eI = {
      ...editingProduct,
      unitPrice: uP.amount,
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingProduct(eI)
  }

  const changeProductQuantity = (delta) => {
    if (delta <= 0 && editingProduct.quantity <= 0) {
      return
    }
    let eI = {
      ...editingProduct,
      quantity: editingProduct.quantity + delta
    }
    setEditingProduct(eI)
  }

  const changeProductDescription = (e) => {
    let v = e.target.value
    let eI = {
      ...editingProduct,
      description: v
    }
    setEditingProduct(eI)
  }

  const createOrUpdateProduct = () => {
    saveProduct(editingProduct)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(() => {
              console.info("Save product successfully")
              setEditingProduct({})
            })
        }
      }).finally(() => {
        setShowProductDetailModal(false)
      })
  }

  const cancelEditingProduct = () => {
    setShowProductDetailModal(false)
    setEditingProduct({})
  }

  const changeFilteredName = (e) => {
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
            }).catch(() => setProducts({}))
        }
      }).catch(() => {
        setProducts({})
      })
  }

  const onFileChange = (e) => {
    // let upload = e.target.files;
    // if (upload.length < 1) return;

    // putObject(upload[0], 'ps-dc-pub', 'psassistant/product/phucsinh_logo.jpg')
    //   .then(rsp => {
    //     if (rsp.ok) {
    //       rsp.json()
    //         .then(data => {
    //           let url = 'https://storage.googleapis.com/ps-dc-pub/' + data.objectKey
    //           let uO = {
    //             ...editingProduct,
    //             featureImgUrl: url
    //           }
    //           setEditingProduct(uO)
    //         })
    //     }
    //   })
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
        />
      </div>
      <div className="max-h-fit overflow-hidden">
        <div className="flex flex-col space-y-1">
          {Object.values(products).map((product) => {
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
                value={editingProduct.name}
                onChange={changeProductName}
                // rightIcon={HiOutlineCash}
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
                  value={editingProduct.quantity}
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
                type="text"
                required={false}
                value={editingProduct.description}
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
              <FileInput id="featureImgUrl" onChange={onFileChange} />
              <img className="w-auto h-12"
                src={editingProduct.featureImgUrl}
                alt="" />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center">
          <Button onClick={createOrUpdateProduct} className="mx-2">
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
