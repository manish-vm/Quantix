import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../services/api';
import '../../styles/ProductMaster.css';

const ProductMaster = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [demoDataList, setDemoDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ partNo: '', description: '' });
  const [demoForm, setDemoForm] = useState({ partNo: '', overallWeight: '', totalCount: '' });
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchPartNo, setSearchPartNo] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [showPartNoSuggestions, setShowPartNoSuggestions] = useState(false);
  const [showDescriptionSuggestions, setShowDescriptionSuggestions] = useState(false);
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);
  const partNoInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const partNoDropdownRef = useRef(null);
  const descriptionDropdownRef = useRef(null);

  const fetchTableData = useCallback(async (page, partNo = searchPartNo, description = searchDescription) => {
    setLoading(true);
    try {
      let url = `/products?page=${page}&limit=${itemsPerPage}`;
      if (partNo) url += `&partNo=${encodeURIComponent(partNo)}`;
      if (description) url += `&description=${encodeURIComponent(description)}`;
      const res = await api.get(url);
      if (res.data && Array.isArray(res.data.products)) {
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || page);
      } else {
        setProducts(res.data);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchPartNo, searchDescription, itemsPerPage]);

  useEffect(() => {
    fetchAllProducts();
    fetchDemoData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTableData(1);
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchPartNo, searchDescription, fetchTableData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (partNoDropdownRef.current && !partNoDropdownRef.current.contains(e.target) && !partNoInputRef.current?.contains(e.target)) {
        setShowPartNoSuggestions(false);
      }
      if (descriptionDropdownRef.current && !descriptionDropdownRef.current.contains(e.target) && !descriptionInputRef.current?.contains(e.target)) {
        setShowDescriptionSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllProducts = async () => {
    try {
      const res = await api.get('/products');
      setAllProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDemoData = async () => {
    try {
      const res = await api.get('/demo-data');
      setDemoDataList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    fetchTableData(1);
  };

  const handleClearSearch = () => {
    setSearchPartNo('');
    setSearchDescription('');
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      setFormData({ partNo: '', description: '' });
      setMessage('Product created successfully');
      fetchTableData(1);
      fetchAllProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleCreateDemo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/demo-data', {
        partNo: demoForm.partNo,
        overallWeight: parseFloat(demoForm.overallWeight),
        totalCount: parseInt(demoForm.totalCount)
      });
      setDemoForm({ partNo: '', overallWeight: '', totalCount: '' });
      setMessage('Demo data created successfully');
      fetchTableData(currentPage);
      fetchDemoData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating demo data');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/products/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message);
      fetchTableData(1);
      fetchAllProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error uploading file');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setEditDescription(product.description);
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await api.put(`/products/${id}`, { description: editDescription });
      const updatedProduct = res.data;
      setMessage('Product updated successfully');
      setEditingId(null);
      setProducts(prev => prev.map(p => p._id === id ? updatedProduct : p));
      setAllProducts(prev => prev.map(p => p._id === id ? updatedProduct : p));
      setDemoDataList(prev => prev.map(d =>
        d.partNo === updatedProduct.partNo
          ? { ...d, partDescription: updatedProduct.description }
          : d
      ));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating product');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDescription('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      setMessage(res.data.message || 'Product deleted successfully');
      const deletedPartNo = res.data.deletedProduct?.partNo;
      setProducts(prev => prev.filter(p => p._id !== id));
      setAllProducts(prev => prev.filter(p => p._id !== id));
      setDemoDataList(prev => prev.filter(d => d.partNo !== deletedPartNo));
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
        fetchTableData(currentPage - 1);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error deleting product');
    }
  };

  const getDemoForProduct = (partNo) => {
    return demoDataList.find(d => d.partNo === partNo.toUpperCase());
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchTableData(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const getPartNoSuggestions = () => {
    if (!searchPartNo) return [];
    return allProducts
      .filter(p => p.partNo.toLowerCase().includes(searchPartNo.toLowerCase()))
      .slice(0, 5);
  };

  const getDescriptionSuggestions = () => {
    if (!searchDescription) return [];
    return allProducts
      .filter(p => p.description.toLowerCase().includes(searchDescription.toLowerCase()))
      .slice(0, 5);
  };

  return (
    <div className="quantix-product-master">
      <h1 className="quantix-product-master__title">Product Master</h1>

      {message && (
        <div className="quantix-product-master__message">
          {message}
        </div>
      )}

      <div className="quantix-product-master__grid">
        <div className="quantix-product-master__card">
          <h3 className="quantix-product-master__card-title">Add Product</h3>
          <form onSubmit={handleCreateProduct}>
            <input
              placeholder="Part No"
              value={formData.partNo}
              onChange={(e) => setFormData({ ...formData, partNo: e.target.value })}
              className="quantix-product-master__input"
              required
            />
            <input
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="quantix-product-master__input"
              required
            />
            <button type="submit" className="quantix-product-master__button">Add Product</button>
          </form>
        </div>

        <div className="quantix-product-master__card">
          <h3 className="quantix-product-master__card-title">Create Demo Data</h3>
          <form onSubmit={handleCreateDemo}>
            <select
              value={demoForm.partNo}
              onChange={(e) => setDemoForm({ ...demoForm, partNo: e.target.value })}
              className="quantix-product-master__input"
              required
            >
              <option value="">Select Part No</option>
              {allProducts.map(p => (
                <option key={p._id} value={p.partNo}>{p.partNo} - {p.description}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Overall Weight (kg)"
              value={demoForm.overallWeight}
              onChange={(e) => setDemoForm({ ...demoForm, overallWeight: e.target.value })}
              className="quantix-product-master__input"
              required
            />
            <input
              type="number"
              placeholder="Total Count"
              value={demoForm.totalCount}
              onChange={(e) => setDemoForm({ ...demoForm, totalCount: e.target.value })}
              className="quantix-product-master__input"
              required
            />
            <button type="submit" className="quantix-product-master__button">Create Baseline</button>
          </form>
        </div>

        <div className="quantix-product-master__card">
          <h3 className="quantix-product-master__card-title">Bulk Upload</h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="quantix-product-master__button quantix-product-master__button--green"
          >
            Upload Excel File
          </button>
          <p className="quantix-product-master__upload-hint">
            Excel should have columns: Part No, Description
          </p>
        </div>

        <div className="quantix-product-master__card">
          <h3 className="quantix-product-master__card-title">Product List</h3>
          <div className="quantix-product-master__filters">
            <div className="quantix-product-master__suggest-wrap" ref={partNoDropdownRef}>
              <input
                type="text"
                placeholder="Search Part No"
                value={searchPartNo}
                ref={partNoInputRef}
                onChange={(e) => { setSearchPartNo(e.target.value); setShowPartNoSuggestions(true); }}
                onFocus={() => setShowPartNoSuggestions(true)}
                className="quantix-product-master__input"
              />
              {showPartNoSuggestions && getPartNoSuggestions().length > 0 && (
                <ul className="quantix-product-master__suggestions">
                  {getPartNoSuggestions().map(p => (
                    <li key={p._id} onClick={() => { setSearchPartNo(p.partNo); setShowPartNoSuggestions(false); }}>
                      {p.partNo}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="quantix-product-master__suggest-wrap" ref={descriptionDropdownRef}>
              <input
                type="text"
                placeholder="Search Description"
                value={searchDescription}
                ref={descriptionInputRef}
                onChange={(e) => { setSearchDescription(e.target.value); setShowDescriptionSuggestions(true); }}
                onFocus={() => setShowDescriptionSuggestions(true)}
                className="quantix-product-master__input"
              />
              {showDescriptionSuggestions && getDescriptionSuggestions().length > 0 && (
                <ul className="quantix-product-master__suggestions">
                  {getDescriptionSuggestions().map(p => (
                    <li key={p._id} onClick={() => { setSearchDescription(p.description); setShowDescriptionSuggestions(false); }}>
                      {p.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={handleSearch} className="quantix-product-master__button">Search</button>
            <button onClick={handleClearSearch} className="quantix-product-master__button quantix-product-master__button--grey">Clear</button>
          </div>
          <table className="quantix-product-master__table">
            <thead>
              <tr>
                <th>Part No</th>
                <th>Description</th>
                <th>Unit Weight</th>
                <th>Overall Weight</th>
                <th>Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="quantix-product-master__empty">Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="quantix-product-master__empty">No products found</td>
                </tr>
              ) : (
                products.map((product) => {
                  const demo = getDemoForProduct(product.partNo);
                  const isEditing = editingId === product._id;
                  return (
                    <tr key={product._id}>
                      <td className="quantix-product-master__part-no">{product.partNo}</td>
                      <td>
                        {isEditing ? (
                          <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="quantix-product-master__input quantix-product-master__input--inline"
                          />
                        ) : (
                          product.description
                        )}
                      </td>
                      <td>
                        {demo ? `${demo.unitWeight.toFixed(3)} kg` : '-'}
                      </td>
                      <td>
                        {demo ? `${demo.overallWeight} kg` : '-'}
                      </td>
                      <td>
                        {demo ? (
                          <span className={`quantix-product-master__badge ${demo.remainingCount > 0 ? 'quantix-product-master__badge--success' : 'quantix-product-master__badge--error'}`}>
                            {demo.remainingCount} / {demo.totalCount}
                          </span>
                        ) : (
                          <span className="quantix-product-master__no-baseline">No baseline</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveEdit(product._id)} className="quantix-product-master__action-btn quantix-product-master__action-btn--save">Save</button>
                            <button onClick={handleCancelEdit} className="quantix-product-master__action-btn quantix-product-master__action-btn--cancel">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(product)} className="quantix-product-master__action-btn quantix-product-master__action-btn--edit">Edit</button>
                            <button onClick={() => handleDelete(product._id)} className="quantix-product-master__action-btn quantix-product-master__action-btn--delete">Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="quantix-product-master__pagination">
              <button
                className="quantix-product-master__pagination-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="quantix-product-master__pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="quantix-product-master__pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductMaster;

