pipeline {
  agent any

  environment {
    IMAGE_NAME = "devops-app"
    IMAGE_TAG  = "1"
    // Jenkins will use this during kubectl commands
    KUBECONFIG = "/tmp/kubeconfig-linux"
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
        sh '''
          set -eux

          export KUBECONFIG=/root/.kube/config

          echo "--- Current context ---"
          kubectl config current-context || true
          kubectl config use-context minikube || true

          echo "--- Apply Kubernetes manifests ---"
          kubectl apply -f k8s/deployment.yaml
          kubectl apply -f k8s/service.yaml

          echo "--- Wait for rollout ---"
          kubectl rollout status deployment/devops-app --timeout=120s

          echo "--- Verify resources ---"
          kubectl get pods -o wide
          kubectl get svc

          echo ""
          echo "Deployment complete!"
        '''
      }
    }

  }

  post {
    success {
      echo "CI/CD Pipeline SUCCESSFUL"
      emailext(
        to: 'nathanielchengyx@gmail.com',
        subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        body: """Build SUCCESS<br/>
Job: ${env.JOB_NAME}<br/>
Build: #${env.BUILD_NUMBER}<br/>
URL: ${env.BUILD_URL}<br/>"""
      )
    }

    failure {
      echo "Pipeline failed — check console logs"
      emailext(
        to: 'nathanielchengyx@gmail.com',
        subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        body: """Build FAILED<br/>
Job: ${env.JOB_NAME}<br/>
Build: #${env.BUILD_NUMBER}<br/>
URL: ${env.BUILD_URL}<br/>
Check Console Output for errors."""
      )
    }

    always {
      echo "Pipeline finished (success or failure)."
    }
  }
}
