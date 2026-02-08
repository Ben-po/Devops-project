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

          # create a Linux-friendly kubeconfig inside the container
          minikube kubectl -- config view --raw > /tmp/kubeconfig
          export KUBECONFIG=/tmp/kubeconfig

          minikube kubectl -- apply -f k8s/deployment.yaml
          minikube kubectl -- apply -f k8s/service.yaml

          minikube kubectl -- rollout restart deployment devops-app
          minikube kubectl -- get pods
          minikube kubectl -- get svc
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
