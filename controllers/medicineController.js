import Medicine from '../models/medicineModel.js';

// Get all medicines
export const getAllMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const filter = category ? { category } : {};
    
    const medicines = await Medicine.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
    
    const total = await Medicine.countDocuments(filter);
    
    res.json({
      success: true,
      data: medicines,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medicines',
      error: error.message
    });
  }
};

// Get medicine by ID
export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medicine',
      error: error.message
    });
  }
};

// Search medicines
export const searchMedicines = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    
    let filter = {};
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { shortDesc: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    const medicines = await Medicine.find(filter).sort({ name: 1 });
    
    res.json({
      success: true,
      data: medicines,
      count: medicines.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching medicines',
      error: error.message
    });
  }
};

// Create new medicine (admin only)
export const createMedicine = async (req, res) => {
  try {
    const { name, price, shortDesc, image, category } = req.body;
    
    const medicine = new Medicine({
      name,
      price,
      shortDesc,
      image,
      category
    });
    
    const savedMedicine = await medicine.save();
    
    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: savedMedicine
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating medicine',
      error: error.message
    });
  }
};

// Update medicine (admin only)
export const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating medicine',
      error: error.message
    });
  }
};

// Delete medicine (admin only)
export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting medicine',
      error: error.message
    });
  }
};
