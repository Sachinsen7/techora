import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { getAllCategories } from "../services/api";
import CategoryComponent from "./course/Category";
import Loader from "./common/Loader";
import Button from "./common/Button";

function FilterSidebar({ currentFilters, onFilterChange, onClose }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(
    currentFilters.category || ""
  );
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || "");
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setErrorCategories(null);
      try {
        const data = await getAllCategories();
        setCategories(data.categories);
      } catch (err) {
        setErrorCategories(err.message || "Failed to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(currentFilters.category || "");
    setMinPrice(currentFilters.minPrice || "");
    setMaxPrice(currentFilters.maxPrice || "");
  }, [currentFilters]);

  const handleApplyFilters = () => {
    const newFilters = {
      category: selectedCategory,
      minPrice: minPrice !== "" ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,
    };

    Object.keys(newFilters).forEach((key) => {
      if (
        newFilters[key] === "" ||
        newFilters[key] === undefined ||
        (typeof newFilters[key] === "number" && isNaN(newFilters[key]))
      ) {
        delete newFilters[key];
      }
    });
    onFilterChange(newFilters);
    onClose();
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    onFilterChange({});
    onClose();
  };

  return (
    <div className="bg-background-card p-md rounded-lg shadow-md border border-secondary-light font-sans">
      <div className="flex justify-between items-center mb-md">
        <h2 className="text-xl font-bold text-text-primary">Filter Courses</h2>
        <button
          className="lg:hidden text-text-primary hover:text-primary-light"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="mb-lg">
        <button
          className="flex justify-between w-full text-lg font-semibold text-text-primary mb-md"
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
        >
          Categories
          <span>{isCategoryOpen ? "▲" : "▼"}</span>
        </button>
        <AnimatePresence>
          {isCategoryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {loadingCategories ? (
                <Loader />
              ) : errorCategories ? (
                <p className="text-accent-error text-sm">{errorCategories}</p>
              ) : categories.length === 0 ? (
                <p className="text-text-secondary text-sm">
                  No categories available.
                </p>
              ) : (
                <div className="flex flex-wrap gap-sm">
                  {categories.map((cat) => (
                    <CategoryComponent
                      key={cat._id}
                      category={cat}
                      onClick={() =>
                        setSelectedCategory((prev) =>
                          prev === cat._id ? "" : cat._id
                        )
                      }
                      isSelected={selectedCategory === cat._id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-lg">
        <button
          className="flex justify-between w-full text-lg font-semibold text-text-primary mb-md"
          onClick={() => setIsPriceOpen(!isPriceOpen)}
        >
          Price Range
          <span>{isPriceOpen ? "▲" : "▼"}</span>
        </button>
        <AnimatePresence>
          {isPriceOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-sm">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 p-sm border border-secondary-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-main text-text-primary"
                />
                <span className="text-text-secondary">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 p-sm border border-secondary-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-main text-text-primary"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col space-y-sm">
        <Button
          text="Apply Filters"
          onClick={handleApplyFilters}
          className="w-full"
        />
        <Button
          text="Clear Filters"
          variant="outline"
          onClick={handleClearFilters}
          className="w-full"
        />
      </div>
    </div>
  );
}

FilterSidebar.propTypes = {
  currentFilters: PropTypes.shape({
    category: PropTypes.string,
    minPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FilterSidebar;
