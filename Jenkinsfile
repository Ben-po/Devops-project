pipeline {
  agent any

  environment {
    IMAGE_NAME = "devops-app"
    IMAGE_TAG  = "1"

    // make kubectl inside Jenkins use mounted kubeconfig
    KUBECONFIG = "/var/jenkins_home/.kube/config"
  }

  tools {
    nodejs "node18"
  }

  stages {

    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("Install Dependencies") {
      steps {
        sh "npm ci"
      }
    }

    stage("Run Tests") {
      steps {
        sh "npm test"
      }
    }

    // 🔥 helpful debugging (great for report screenshots)
    stage("Tools Check") {
      steps {
        sh """
          echo '--- TOOL VERSIONS ---'
          node -v
          npm -v
          docker --version
          kubectl version --client
        """
      }
    }

    stage("Build Docker Image") {
      steps {
        sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
      }
    }

    stage("Deploy to Minikube") {
      steps {
        sh """
          set -eux

          echo '--- KUBE CONTEXTS ---'
          kubectl config get-contexts || true

          # force correct context
          kubectl config use-context minikube || true

          # apply without validation (fixes openapi/auth issue)
          kubectl apply --validate=false -f k8s/deployment.yaml
          kubectl apply --validate=false -f k8s/service.yaml

          # restart deployment to pick new image
          kubectl rollout restart deployment devops-app

          echo '--- POD STATUS ---'
          kubectl get pods

          echo '--- SERVICE STATUS ---'
          kubectl get svc
        """
      }
    }
  }

  post {
    success {
      echo "CI/CD Pipeline SUCCESSFUL"
    }
    failure {
      echo "Pipeline failed — check console logs"
    }
  }
}
