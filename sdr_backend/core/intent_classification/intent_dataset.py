# scripts/train_intent_classifier.py
import os
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from torch.utils.data import Dataset
import pandas as pd
import numpy as np
from config.settings import ML_MODELS_DIR
from core.intent_classification.validation_data import validation_data
from core.intent_classification.training_data import training_data
from utils.logger import log_info
from sklearn.metrics import precision_recall_fscore_support


class IntentDataset(Dataset):
    """Dataset for training the intent classifier."""
    
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self):
        return len(self.texts)
        
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors="pt"
        )
        
        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": torch.tensor(label, dtype=torch.long)
        }

def train_intent_classifier(ml_models_dir=ML_MODELS_DIR):
    """
    Train a DistilBERT model for intent classification.
    
    Args:
        ml_models directory: Directory to save the trained model
    """

    log_info(f"Training intent classifier in {ml_models_dir}")

    # Create the ml_models directory if it doesn't exist
    os.makedirs(ml_models_dir, exist_ok=True)

    # Sample training data (for now small dataset, this would be a larger dataset)
    train_data = training_data
    # Validation data
    val_data = validation_data
    
    # Create DataFrames
    train_df = pd.DataFrame(train_data)
    val_df = pd.DataFrame(val_data)
    
    # Load tokenizer
    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
    
    # Create datasets
    train_dataset = IntentDataset(
        texts=train_df["text"].tolist(),
        labels=train_df["label"].tolist(),
        tokenizer=tokenizer
    )
    
    val_dataset = IntentDataset(
        texts=val_df["text"].tolist(),
        labels=val_df["label"].tolist(),
        tokenizer=tokenizer
    )
    
    # Load model
    model = DistilBertForSequenceClassification.from_pretrained(
        "distilbert-base-uncased",
        num_labels=3
    )
    
    # Define a compute_metrics function
    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        predictions = np.argmax(logits, axis=-1)
        precision, recall, f1, _ = precision_recall_fscore_support(labels, predictions, average='weighted')
        accuracy = np.mean(predictions == labels)
        return {"accuracy": accuracy, "precision": precision, "recall": recall, "f1": f1}
    
    # Define training arguments
    training_args = TrainingArguments(
        output_dir=ml_models_dir,
        num_train_epochs=3,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir=f"{ml_models_dir}/logs",
        logging_steps=10,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",  # Optimize for F1-score
        greater_is_better=True
    )
    
    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics
    )
    
    # Train the model
    trainer.train()
    
    # Save the model and tokenizer
    model.save_pretrained(ml_models_dir)
    tokenizer.save_pretrained(ml_models_dir)
    
    print(f"Model saved to {ml_models_dir}")
    