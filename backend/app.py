import io
import base64
import random
import numpy as np
import torch
import torch.nn.functional as F
import timm
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from torchvision import transforms

# ── Reproducibility ──────────────────────────────────────────────────────────
torch.manual_seed(42)
np.random.seed(42)
random.seed(42)

app = FastAPI(title="Medical AI - COVID-19 Classifier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASSES = ["COVID", "Normal", "Viral Pneumonia"]
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def load_model() -> torch.nn.Module:
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=3)
    state = torch.load("best_model.pth", map_location=DEVICE)
    model.load_state_dict(state)
    model.to(DEVICE)
    model.eval()
    return model


try:
    model = load_model()
except Exception as e:
    print(f"Warning: Could not load model weights: {e}")
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=3)
    model.to(DEVICE)
    model.eval()


def encode_image(img: Image.Image) -> str:
    with io.BytesIO() as buf:
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")


def compute_gradcam(input_tensor: torch.Tensor, rgb_np: np.ndarray) -> str:
    target_layers = [model.conv_head]
    with GradCAM(model=model, target_layers=target_layers) as cam:
        grayscale_cam = cam(input_tensor=input_tensor, targets=None)[0]
    cam_image = show_cam_on_image(rgb_np, grayscale_cam, use_rgb=True)
    return encode_image(Image.fromarray(cam_image))


def run_inference(input_tensor: torch.Tensor) -> tuple[str, float, dict]:
    with torch.inference_mode():
        logits = model(input_tensor)
        probs = F.softmax(logits, dim=1).cpu().numpy()[0]
    predictions = {cls: round(float(p), 6) for cls, p in zip(CLASSES, probs)}
    predicted_class = CLASSES[int(np.argmax(probs))]
    confidence = float(np.max(probs))
    return predicted_class, confidence, predictions


@app.get("/")
def root():
    return {"status": "Medical AI API is running"}


@app.get("/health")
def health():
    return {"status": "ok", "device": str(DEVICE), "classes": CLASSES}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    raw = await file.read()
    try:
        with io.BytesIO(raw) as buf:
            pil_img = Image.open(buf).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    img_resized = pil_img.resize((224, 224))
    rgb_np = np.array(img_resized).astype(np.float32) / 255.0
    input_tensor = transform(pil_img).unsqueeze(0).to(DEVICE)

    predicted_class, confidence, predictions = run_inference(input_tensor)
    gradcam_b64 = compute_gradcam(input_tensor, rgb_np)
    original_b64 = encode_image(img_resized)

    return JSONResponse({
        "predicted_class": predicted_class,
        "confidence": round(confidence, 6),
        "predictions": predictions,
        "gradcam_image": gradcam_b64,
        "original_image": original_b64,
    })
