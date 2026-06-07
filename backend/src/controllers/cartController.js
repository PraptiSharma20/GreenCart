import Cart from "../models/Cart.js";

export const getCart = async (req, res) => {
  try {
    console.log("Fetching cart for user:", req.user.id);
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
    console.log("Cart found:", cart);
    if (!cart) {
      console.log("No cart found, returning empty");
      return res.json({ items: [] });
    }
    console.log("Cart items:", cart.items);
    res.json(cart);
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    console.log("Adding to cart for user:", req.user.id, "Product:", productId, "Qty:", quantity);
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      console.log("Creating new cart");
      cart = new Cart({ user: req.user.id, items: [{ product: productId, quantity }] });
    } else {
      console.log("Found existing cart, checking items");
      const itemIndex = cart.items.findIndex((item) => {
        const itemProductId = item.product?._id?.toString() || item.product?.toString();
        return itemProductId === productId;
      });
      if (itemIndex > -1) {
        console.log("Item already in cart, updating quantity");
        cart.items[itemIndex].quantity += quantity;
      } else {
        console.log("Adding new item to cart");
        cart.items.push({ product: productId, quantity });
      }
    }
    await cart.save();
    console.log("Cart saved, now populating product data");
    const populatedCart = await Cart.findById(cart._id).populate("items.product");
    console.log("Populated cart items:", populatedCart.items);
    res.json(populatedCart);
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ items: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  let { quantity } = req.body;
  const { productId } = req.params;
  quantity = Math.max(1, quantity); // Ensure quantity is at least 1
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      const populatedCart = await Cart.findById(cart._id).populate("items.product");
      res.json(populatedCart);
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  const { productId } = req.params;
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate("items.product");
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
