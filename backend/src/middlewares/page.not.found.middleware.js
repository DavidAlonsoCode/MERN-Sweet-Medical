function pageNotFoundHandler(_req, res) {
  return res.status(404).json({
    message: "Ruta no encontrada",
  });
}

export default pageNotFoundHandler;
