pipeline {
  agent any

  tools {
    nodejs "node18"
  }

  environment {
    IMAGE_NAME = "devops-app"
    IMAGE_TAG  = "1"
  }

  stages {
    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("Install") {
      steps {
        sh "npm ci"
      }
    }

    stage("Test") {
      steps {
        sh "npm test"
      }
    }

    stage("Build Docker Image") {
      steps {
        sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
      }
    }

    stage("Deploy to Minikube") {
      steps {
        sh "kubectl apply -f k8s/deployment.yaml"
        sh "kubectl apply -f k8s/service.yaml"
        sh "kubectl rollout restart deployment devops-app"
        sh "kubectl get pods"
        sh "kubectl get svc"
      }
    }
  }

  post {
    always {
      echo "Pipeline finished (success or failure)."
    }
    success {
      echo "SUCCESS: Build/Test/Deploy completed."
    }
    failure {
      echo "FAILED: Check Console Output for the error."
    }
  }
}
